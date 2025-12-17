# ============================================================
# Start Docker daemon (Windows)
# - Preferred: Docker Engine inside WSL2 (no Docker Desktop)
# - Optional fallback: Docker Desktop
#
# This script is used by:
# - scripts/dev.ps1 (dot-sourced)
# - NodeManager auto-start (spawned)
# ============================================================

param(
  [int]$TimeoutSeconds = 60,
  [switch]$NoDesktopFallback
)

$ErrorActionPreference = 'SilentlyContinue'

function Test-DockerWindows {
  try {
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $cmd) { return $false }
    $out = & cmd.exe /c "docker info 2>&1"
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

function Test-DockerTcpLoopback {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:2375/_ping' -TimeoutSec 2
    return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300)
  } catch {
    return $false
  }
}

function Get-WslIp {
  try {
    $sysRoot = $env:SystemRoot
    if (-not $sysRoot) { $sysRoot = 'C:\Windows' }
    $wslPath = Join-Path $sysRoot 'System32\wsl.exe'
    if (-not (Test-Path $wslPath)) { return $null }
    $raw = (& $wslPath -e sh -lc "hostname -I" 2>$null)
    if (-not $raw) { return $null }
    return ($raw -split '\s+' | Where-Object { $_ } | Select-Object -First 1)
  } catch {
    return $null
  }
}

function Get-WslIps {
  try {
    $sysRoot = $env:SystemRoot
    if (-not $sysRoot) { $sysRoot = 'C:\Windows' }
    $wslPath = Join-Path $sysRoot 'System32\wsl.exe'
    if (-not (Test-Path $wslPath)) { return @() }
    $raw = (& $wslPath -e sh -lc "hostname -I" 2>$null)
    if (-not $raw) { return @() }

    $ips = @(
      ($raw -split '\s+') |
        Where-Object { $_ } |
        Where-Object { $_ -match '^\d{1,3}(?:\.\d{1,3}){3}$' } |
        Where-Object { $_ -ne '127.0.0.1' -and $_ -ne '0.0.0.0' }
    )

    # Avoid common non-reachable-from-Windows interfaces (docker0 inside WSL).
    $ips = @($ips | Where-Object { $_ -ne '172.17.0.1' })

    return $ips
  } catch {
    return @()
  }
}

function Get-WslDockerCandidateIps {
  $candidates = New-Object System.Collections.Generic.List[string]

  if ($env:WSL_DOCKER_IP) {
    $candidates.Add($env:WSL_DOCKER_IP)
  }

  foreach ($ip in (Get-WslIps)) {
    if (-not $candidates.Contains($ip)) {
      $candidates.Add($ip)
    }
  }

  # Last resort: whatever legacy single-IP getter returns.
  $legacy = Get-WslIp
  if ($legacy -and -not $candidates.Contains($legacy)) {
    $candidates.Add($legacy)
  }

  return @($candidates)
}

function Select-ReachableWslDockerIp {
  $candidates = @(Get-WslDockerCandidateIps)
  foreach ($ip in $candidates) {
    if (Test-DockerTcpWslIp $ip) {
      return $ip
    }
  }
  return ($candidates | Select-Object -First 1)
}

function Test-DockerTcpWslIp([string]$WslIp) {
  if (-not $WslIp) { return $false }
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri ("http://" + $WslIp + ":2375/_ping") -TimeoutSec 2
    return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300)
  } catch {
    return $false
  }
}

function Start-DockerInWsl {
  try {
    $sysRoot = $env:SystemRoot
    if (-not $sysRoot) { $sysRoot = 'C:\Windows' }
    $wslPath = Join-Path $sysRoot 'System32\wsl.exe'
    if (-not (Test-Path $wslPath)) {
      Write-Host "[Docker] wsl.exe introuvable" -ForegroundColor DarkYellow
      return $false
    }

    # Warmup WSL
    & $wslPath -e sh -lc "true" | Out-Null

    # Start docker daemon as root (no sudo password prompt)
    # Try systemd first, then SysV service, then raw dockerd.
    # Also ensure a loopback-only TCP endpoint is available on 127.0.0.1:2375.
    # If dockerd isn't configured for TCP, we create a socat proxy to /var/run/docker.sock.
    # IMPORTANT: bind on 0.0.0.0 so the Windows host can reach it via the WSL VM IP.
    # IMPORTANT: keep this as a valid POSIX `sh -lc` one-liner (no empty `then;`).
    $cmd = 'set -e; '
    $cmd += 'if command -v systemctl >/dev/null 2>&1; then systemctl start docker 2>/dev/null || true; fi; '
    $cmd += 'if command -v service >/dev/null 2>&1; then service docker start 2>/dev/null || true; fi; '
    $cmd += 'if command -v pgrep >/dev/null 2>&1; then pgrep -x dockerd >/dev/null 2>&1 || (nohup dockerd >/dev/null 2>&1 &); else (nohup dockerd >/dev/null 2>&1 &); fi; '
    $cmd += 'i=0; while [ $i -lt 40 ] && [ ! -S /var/run/docker.sock ]; do i=$((i+1)); sleep 0.25; done; '
    $cmd += 'LISTENING=0; '
    $cmd += 'if command -v ss >/dev/null 2>&1; then ss -lnt 2>/dev/null | grep -q ":2375" && LISTENING=1 || true; '
    $cmd += 'elif command -v netstat >/dev/null 2>&1; then netstat -tln 2>/dev/null | grep -q ":2375" && LISTENING=1 || true; fi; '
    $cmd += 'if [ "$LISTENING" -ne 1 ]; then '
    $cmd += '  if ! command -v socat >/dev/null 2>&1; then (apt-get update -y >/dev/null 2>&1 || true); (apt-get install -y socat >/dev/null 2>&1 || true); fi; '
    $cmd += '  if command -v socat >/dev/null 2>&1; then '
    $cmd += '    if command -v pgrep >/dev/null 2>&1; then pgrep -f "socat.*TCP-LISTEN:2375" >/dev/null 2>&1 || (nohup socat TCP-LISTEN:2375,bind=0.0.0.0,reuseaddr,fork UNIX-CONNECT:/var/run/docker.sock >/dev/null 2>&1 &); '
    $cmd += '    else (nohup socat TCP-LISTEN:2375,bind=0.0.0.0,reuseaddr,fork UNIX-CONNECT:/var/run/docker.sock >/dev/null 2>&1 &); fi; '
    $cmd += '  fi; '
    $cmd += 'fi; '
    $cmd += 'exit 0'

    & $wslPath -u root -e sh -lc $cmd | Out-Null

    return $true
  } catch {
    return $false
  }
}

function Start-DockerDesktop {
  try {
    $paths = @(
      'C:\Program Files\Docker\Docker\Docker Desktop.exe',
      (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
      (Join-Path ${env:ProgramFiles(x86)} 'Docker\Docker\Docker Desktop.exe')
    ) | Where-Object { $_ -and (Test-Path $_) }

    if (-not $paths -or $paths.Count -eq 0) {
      return $false
    }

    Start-Process -FilePath $paths[0] -ArgumentList @() -WindowStyle Hidden | Out-Null
    return $true
  } catch {
    return $false
  }
}

# Note: keep logs focused. This script is often invoked automatically (dev + runtime),
# so avoid printing a noisy banner every time.

# If Docker is already available on Windows, we're done.
if (Test-DockerWindows) {
  Write-Host "[Docker] Docker déjà disponible (Windows CLI)" -ForegroundColor Green
  return
}

# If WSL2 Docker is already reachable over TCP, don't do any WSL-side work.
$existingCandidates = @(Get-WslDockerCandidateIps)
$existingWslIp = Select-ReachableWslDockerIp
if (Test-DockerTcpLoopback -or ($existingWslIp -and (Test-DockerTcpWslIp $existingWslIp))) {
  if ($existingWslIp) {
    Write-Host "[Docker] Docker Engine WSL2 déjà accessible (tcp://$existingWslIp:2375)" -ForegroundColor Green
  } else {
    Write-Host "[Docker] Docker Engine déjà accessible (TCP)" -ForegroundColor Green
  }
  return
}

# Prefer WSL2 Engine when available.
$preferWsl2 = $true
if ($env:DOCKER_PREFER_WSL2 -and $env:DOCKER_PREFER_WSL2.ToLower() -eq 'false') { $preferWsl2 = $false }

if ($preferWsl2) {
  Write-Host "[Docker] Tentative de démarrage Docker Engine dans WSL2..." -ForegroundColor Cyan
  $started = Start-DockerInWsl
  if ($started) {
    $wslIp = Select-ReachableWslDockerIp
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $deadline = (Get-Date).AddSeconds([Math]::Max(5, $TimeoutSeconds))
    if ($existingCandidates -and $existingCandidates.Count -gt 0) {
      Write-Host ("[Docker] WSL IP candidates: " + ($existingCandidates -join ', ')) -ForegroundColor DarkGray
    }
    while ((Get-Date) -lt $deadline) {
      if (-not $wslIp) { $wslIp = Select-ReachableWslDockerIp }
      $ready = $false

      if (Test-DockerTcpLoopback) {
        $ready = $true
      } else {
        foreach ($ip in (Get-WslDockerCandidateIps)) {
          if (Test-DockerTcpWslIp $ip) {
            $wslIp = $ip
            $ready = $true
            break
          }
        }
      }

      if ($ready) {
        if ($wslIp) {
          Write-Host ("[Docker] Docker Engine WSL2 opérationnel (tcp://" + $wslIp + ":2375) en " + [Math]::Round($sw.Elapsed.TotalSeconds,1) + "s") -ForegroundColor Green
        } else {
          Write-Host ("[Docker] Docker Engine WSL2 opérationnel en " + [Math]::Round($sw.Elapsed.TotalSeconds,1) + "s") -ForegroundColor Green
        }
        return
      }
      Start-Sleep -Milliseconds 500
    }
    Write-Host "[Docker] WSL2 Docker n'est pas prêt après ${TimeoutSeconds}s (on continue)" -ForegroundColor DarkYellow
  } else {
    Write-Host "[Docker] Impossible de lancer Docker dans WSL2 (on continue)" -ForegroundColor DarkYellow
  }
}

# Optional Desktop fallback
$allowDesktop = $true
if ($env:DOCKER_ALLOW_DESKTOP_FALLBACK -and $env:DOCKER_ALLOW_DESKTOP_FALLBACK.ToLower() -eq 'false') { $allowDesktop = $false }
if ($NoDesktopFallback) { $allowDesktop = $false }

if ($allowDesktop) {
  Write-Host "[Docker] Tentative de démarrage Docker Desktop..." -ForegroundColor Cyan
  if (Start-DockerDesktop) {
    $deadline = (Get-Date).AddSeconds([Math]::Max(10, $TimeoutSeconds))
    while ((Get-Date) -lt $deadline) {
      if (Test-DockerWindows) {
        Write-Host "[Docker] Docker Desktop opérationnel" -ForegroundColor Green
        return
      }
      Start-Sleep -Seconds 2
    }
    Write-Host "[Docker] Docker Desktop n'est pas prêt après ${TimeoutSeconds}s" -ForegroundColor DarkYellow
  } else {
    Write-Host "[Docker] Docker Desktop introuvable" -ForegroundColor DarkYellow
  }
}

Write-Host "[Docker] Auto-start terminé (daemon pas confirmé)" -ForegroundColor DarkYellow
