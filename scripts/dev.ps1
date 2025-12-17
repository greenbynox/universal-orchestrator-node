# ============================================================
# Development Script - Start Docker and Dev Servers
# ============================================================

$currentPath = Get-Location
Write-Host "Repertoire courant: $currentPath" -ForegroundColor Cyan

# Docker peut etre installe sur la machine, ou embarque (client/desktop) dans le repo.

# Lancer le demarrage de Docker DANS LE MÊME PROCESSUS (ne pas créer une sous-shell)
Write-Host "`nLancement de Docker..." -ForegroundColor Cyan
. "scripts/start-docker.ps1"

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

function Test-DockerWsl {
	try {
		$sysRoot = $env:SystemRoot
		if (-not $sysRoot) { $sysRoot = 'C:\Windows' }
		$wslPath = Join-Path $sysRoot 'System32\wsl.exe'
		if (-not (Test-Path $wslPath)) { return $false }
		# Don't require docker CLI or docker-group membership; just ensure WSL is callable.
		& $wslPath -e sh -lc "true" | Out-Null
		return ($LASTEXITCODE -eq 0)
	} catch {
		return $false
	}
}

function Test-DockerTcpLoopback {
	try {
		# Docker daemon responds to /_ping with 'OK' over HTTP.
		$resp = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:2375/_ping' -TimeoutSec 2
		return ($resp.StatusCode -eq 200 -and ($resp.Content -match 'OK'))
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
		$ips = @(
			($raw -split '\s+') |
				Where-Object { $_ } |
				Where-Object { $_ -match '^\d{1,3}(?:\.\d{1,3}){3}$' } |
				Where-Object { $_ -ne '127.0.0.1' -and $_ -ne '0.0.0.0' }
		)

		# Avoid common non-reachable-from-Windows interfaces (docker0 inside WSL)
		$ips = @($ips | Where-Object { $_ -ne '172.17.0.1' })

		return ($ips | Select-Object -First 1)
	} catch {
		return $null
	}
}

function Select-ReachableWslDockerIp {
	# Prefer an IP that is already reachable from Windows (http://<ip>:2375/_ping).
	# This avoids cases where hostname -I returns docker0 (172.17.0.1) first.
	try {
		$sysRoot = $env:SystemRoot
		if (-not $sysRoot) { $sysRoot = 'C:\Windows' }
		$wslPath = Join-Path $sysRoot 'System32\wsl.exe'
		if (-not (Test-Path $wslPath)) { return $null }
		$raw = (& $wslPath -e sh -lc "hostname -I" 2>$null)
		if (-not $raw) { return $null }
		$ips = @(
			($raw -split '\s+') |
				Where-Object { $_ } |
				Where-Object { $_ -match '^\d{1,3}(?:\.\d{1,3}){3}$' } |
				Where-Object { $_ -ne '127.0.0.1' -and $_ -ne '0.0.0.0' } |
				Where-Object { $_ -ne '172.17.0.1' }
		)

		foreach ($ip in $ips) {
			if (Test-DockerTcpWslIp $ip) { return $ip }
		}

		return ($ips | Select-Object -First 1)
	} catch {
		return $null
	}
}

function Test-DockerTcpWslIp([string]$WslIp) {
	if (-not $WslIp) { return $false }
	try {
		$resp = Invoke-WebRequest -UseBasicParsing -Uri ("http://" + $WslIp + ":2375/_ping") -TimeoutSec 2
		return ($resp.StatusCode -eq 200 -and ($resp.Content -match 'OK'))
	} catch {
		return $false
	}
}

Write-Host "`nVerification de Docker (daemon)..." -ForegroundColor Cyan

# Wait for Docker to become available (Windows CLI OR WSL2 Engine).
$maxWaitSec = 60
$deadline = (Get-Date).AddSeconds($maxWaitSec)
$useWsl = $false

while ((Get-Date) -lt $deadline) {
	if (Test-DockerWindows) {
		$useWsl = $false
		break
	}
	# If WSL is present, we can use it as our Docker Engine host.
	if (Test-DockerWsl) {
		$useWsl = $true
		break
	}
	Start-Sleep -Seconds 2
}

if ($useWsl) {
	# IMPORTANT: backend connects via dockerode (Windows process). On some machines, WSL2 localhostForwarding
	# is disabled/broken, so 127.0.0.1:2375 won't work. Prefer the WSL VM IP when needed.
	$wslIp = Select-ReachableWslDockerIp
	if (-not $wslIp) {
		Write-Host "`n[ERREUR] Impossible de detecter l'IP de WSL2 (hostname -I)." -ForegroundColor Red
		exit 1
	}

	if (-not (Test-DockerTcpLoopback) -and -not (Test-DockerTcpWslIp $wslIp)) {
		Write-Host "`n[INFO] WSL2 detecte, tentative de demarrage Docker Engine (WSL2) + endpoint TCP :2375..." -ForegroundColor DarkYellow
		. "scripts/start-docker.ps1" -TimeoutSeconds 60 -NoDesktopFallback | Out-Null
	}

	if (-not (Test-DockerTcpLoopback) -and -not (Test-DockerTcpWslIp $wslIp)) {
		Write-Host "`n[ERREUR] Docker WSL2 non accessible via http://127.0.0.1:2375/_ping NI via http://$wslIp:2375/_ping." -ForegroundColor Red
		Write-Host "`nConseils:" -ForegroundColor Yellow
		Write-Host "- Lancez l'installation: scripts/install-docker-engine-wsl.ps1 (admin)" -ForegroundColor Yellow
		Write-Host "- Dans WSL: systemctl status docker ; ss -lnt | grep 2375" -ForegroundColor Yellow
		Write-Host "- Assurez-vous que dockerd écoute sur tcp://0.0.0.0:2375 (ou au minimum sur l'IP WSL)" -ForegroundColor Yellow
		exit 1
	}

	$env:WSL_DOCKER_IP = $wslIp
	# Use WSL IP by default (works even when localhostForwarding is disabled).
	$env:DOCKER_HOST = ("tcp://" + $wslIp + ":2375")
	# Important: .env sets DOCKER_SOCKET=//./pipe/docker_engine. In WSL2 mode that would force Docker Desktop.
	# Setting it to an empty string prevents dotenv from overriding it, while remaining falsy for our config.
	$env:DOCKER_SOCKET = ''
	$env:DOCKER_PREFER_WSL2 = 'true'
	$env:DOCKER_ALLOW_DESKTOP_FALLBACK = 'false'
	Write-Host "`n[OK] Docker Engine WSL2 detecte. Endpoint OK. DOCKER_HOST=$env:DOCKER_HOST" -ForegroundColor Green
} elseif (Test-DockerWindows) {
	Write-Host "`n[OK] Docker detecte via Docker Desktop/Windows" -ForegroundColor Green
} else {
	Write-Host "`n[ERREUR] Docker n'est pas disponible (daemon inaccessible) apres ${maxWaitSec}s." -ForegroundColor Red
	Write-Host "`nConseils (WSL2 Engine):" -ForegroundColor Yellow
	Write-Host "- Verifiez que WSL2 est installe et qu'Ubuntu est present" -ForegroundColor Yellow
	Write-Host "- Dans Ubuntu/WSL: docker doit etre installe et le service docker doit pouvoir demarrer" -ForegroundColor Yellow
	Write-Host "- Le daemon doit ecouter en loopback: tcp://127.0.0.1:2375 (voir scripts/install-docker-engine-wsl.ps1)" -ForegroundColor Yellow
	Write-Host "`nConseils (Docker Desktop):" -ForegroundColor Yellow
	Write-Host "- Installez/reparez Docker Desktop (service com.docker.service)" -ForegroundColor Yellow
	exit 1
}
Write-Host "Lancement des serveurs de developpement..." -ForegroundColor Cyan
Write-Host "Frontend sera accessible a http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

function Test-TcpPortFree([int]$Port) {
	try {
		# Prefer Get-NetTCPConnection when available.
		$cmd = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue
		if ($cmd) {
			$c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
			return (-not $c)
		}
		# Fallback: netstat parsing
		$lines = & cmd.exe /c "netstat -ano -p tcp" 2>$null
		if (-not $lines) { return $true }
		$pattern = ":$Port\s+LISTENING\s+\d+"
		return (-not ($lines -match $pattern))
	} catch {
		# If detection fails, do not block startup.
		return $true
	}
}

function Select-FreePort([int]$PreferredPort, [int]$MaxOffset = 50) {
	for ($i = 0; $i -le $MaxOffset; $i++) {
		$p = $PreferredPort + $i
		if (Test-TcpPortFree $p) { return $p }
	}
	return $PreferredPort
}

# Backend port selection (avoids EADDRINUSE for demo "clone & run")
$preferred = 3001
if ($env:PORT) {
	try { $preferred = [int]$env:PORT } catch { $preferred = 3001 }
}
$chosen = Select-FreePort -PreferredPort $preferred -MaxOffset 25
if ($chosen -ne $preferred) {
	Write-Host "`n[WARN] Le port $preferred est deja utilise. Utilisation de $chosen a la place (PORT=$chosen)." -ForegroundColor Yellow
}
$env:PORT = "$chosen"
# Vite proxy reads this value (see frontend/vite.config.ts)
$env:VITE_BACKEND_PORT = "$chosen"

# Vite proxy host (defaults to loopback). Keep in sync with backend HOST.
$env:VITE_BACKEND_HOST = '127.0.0.1'

# Safety: never bind the backend remotely in dev unless you *explicitly* set it elsewhere.
# This prevents accidental LAN exposure and proxy mismatch issues.
$env:DEV_BIND_REMOTE = 'false'

# Dev: always bind backend to loopback to avoid firewall/Vite proxy/WebSocket oddities.
# (Docker connectivity is handled separately via DOCKER_HOST / WSL_DOCKER_IP.)
$env:HOST = '127.0.0.1'

# Lancer concurrently - cela va bloquer et afficher les logs des deux serveurs
npm run dev:concurrent
