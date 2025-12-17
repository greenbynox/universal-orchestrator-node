<#
Installe Docker Engine dans WSL2 (sans Docker Desktop).

- Active les features WSL2 si nécessaire (peut demander un reboot)
- Installe une distribution (Ubuntu par défaut) si absente
- Installe Docker Engine via le repo officiel Docker (dernière version)
- Configure dockerd pour exposer un endpoint LOCAL uniquement: tcp://127.0.0.1:2375
  (utile pour que l'app Windows puisse parler au daemon dans WSL2)

IMPORTANT: nécessite des droits administrateur.
Le script écrit un fichier marker dans %TEMP% pour que l'installer NSIS puisse attendre la fin:
  %TEMP%\node-orchestrator-docker-wsl.done

Contenu du marker:
- OK
- REBOOT_REQUIRED: ...
- ERROR: ...
#>

param(
  [string]$Distro = 'Ubuntu',
  [string]$MarkerPath = $(Join-Path $env:TEMP 'node-orchestrator-docker-wsl.done')
)

$ErrorActionPreference = 'Stop'

function Write-Marker([string]$Text) {
  try {
    # ASCII => pas de BOM, plus facile à lire côté NSIS.
    Set-Content -LiteralPath $MarkerPath -Value $Text -Encoding ASCII
  } catch {
    # Best effort
  }
}

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Ce script doit être exécuté en Administrateur.'
  }
}

function Exec-Logged([string]$Label, [ScriptBlock]$Block) {
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Block
}

function Enable-WslFeatures {
  $restartNeeded = $false

  $features = @(
    'Microsoft-Windows-Subsystem-Linux',
    'VirtualMachinePlatform'
  )

  foreach ($f in $features) {
    try {
      $r = Enable-WindowsOptionalFeature -Online -FeatureName $f -All -NoRestart -ErrorAction Stop
      if ($r.RestartNeeded) { $restartNeeded = $true }
    } catch {
      # Sur certains systèmes, Enable-WindowsOptionalFeature peut échouer si DISM est indispo.
      # On laisse remonter pour que l'installer affiche une erreur claire.
      throw
    }
  }

  return $restartNeeded
}

function Ensure-WslInstalled {
  $wsl = Get-Command wsl.exe -ErrorAction SilentlyContinue
  if (-not $wsl) {
    throw 'wsl.exe introuvable (WSL non installé).'
  }

  try {
    & wsl.exe --version | Out-Null
  } catch {
    # --version n'existe pas sur les vieux builds. Ignore.
  }

  try {
    & wsl.exe --set-default-version 2 | Out-Null
  } catch {
    # ignore
  }
}

function Ensure-DistroInstalled([string]$DistroName) {
  $existing = @()
  try {
    $existing = (& wsl.exe -l -q) | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  } catch {
    $existing = @()
  }

  if ($existing -contains $DistroName) {
    return
  }

  # Installer la distro. Selon Windows, cela peut demander un reboot et/ou une interaction.
  # On tente le plus propre possible.
  try {
    & wsl.exe --install -d $DistroName | Out-Null
  } catch {
    # Si --install n'est pas supporté, on ne peut pas installer automatiquement.
    throw "Impossible d'installer automatiquement la distribution '$DistroName'. Installez-la via 'wsl --install -d $DistroName' puis relancez l'installer."
  }
}

function Run-InWsl([string]$DistroName, [string]$BashCommand) {
  # Utilise bash -lc (Ubuntu). Si bash absent, sh -lc tentera quand même.
  & wsl.exe -d $DistroName -- bash -lc $BashCommand
}

function Configure-SystemdAndDocker([string]$DistroName) {
  # Activer systemd
  $wslConfCmd = @'
sudo sh -lc 'set -e
mkdir -p /etc
cat >/etc/wsl.conf <<EOF
[boot]
systemd=true
EOF'
'@
  Run-InWsl $DistroName $wslConfCmd

  # Configure Docker to listen on unix socket + TCP.
  # NOTE: On Ubuntu, docker.service uses socket activation ("-H fd://").
  # Setting "hosts" in /etc/docker/daemon.json can conflict with that and prevent Docker from starting.
  # Fix: use a systemd drop-in override for ExecStart.
  $overrideCmd = @'
sudo sh -lc 'set -e
sudo mkdir -p /etc/systemd/system/docker.service.d
cat >/etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375 --containerd=/run/containerd/containerd.sock
EOF'
'@
  Run-InWsl $DistroName $overrideCmd
}

function Install-DockerEngine([string]$DistroName) {
  # Installation Docker CE (repo officiel)
  $installCmd = @'
set -e
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
'@

  Run-InWsl $DistroName ($installCmd.Replace("\r\n", "\n").Replace("\n", "; "))
}

function Start-DockerEngine([string]$DistroName) {
  # Après activation systemd, il faut redémarrer WSL pour que systemd démarre.
  try { & wsl.exe --shutdown | Out-Null } catch {}

  # Trigger distro start
  try {
    Run-InWsl $DistroName "true"
  } catch {}

  # Start docker
  $startCmd = @'
set -e
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl daemon-reload >/dev/null 2>&1 || true
  sudo systemctl reset-failed docker.service >/dev/null 2>&1 || true
  # Avoid socket activation (fd://) interfering with our ExecStart override
  sudo systemctl disable docker.socket >/dev/null 2>&1 || true
  sudo systemctl enable docker >/dev/null 2>&1 || true
  sudo systemctl start docker
else
  sudo service docker start || true
fi
'@

  Run-InWsl $DistroName ($startCmd.Replace("\r\n", "\n").Replace("\n", "; "))

  # Verify
  Run-InWsl $DistroName "docker version" | Out-Null
  Run-InWsl $DistroName "docker info >/dev/null" | Out-Null
}

# ---- main ----
try {
  if (Test-Path -LiteralPath $MarkerPath) {
    Remove-Item -LiteralPath $MarkerPath -Force -ErrorAction SilentlyContinue
  }

  Assert-Admin

  Exec-Logged 'Activation des fonctionnalités WSL2' {
    $needReboot = Enable-WslFeatures
    if ($needReboot) {
      Write-Marker 'REBOOT_REQUIRED: WSL2 features enabled, reboot Windows puis relancez l''application/installer.'
      Write-Host 'Un redémarrage Windows est requis pour finaliser WSL2.' -ForegroundColor Yellow
      exit 0
    }
  }

  Exec-Logged 'Vérification WSL' { Ensure-WslInstalled }
  Exec-Logged "Vérification distribution ($Distro)" { Ensure-DistroInstalled $Distro }

  Exec-Logged 'Installation Docker Engine (WSL2)' { Install-DockerEngine $Distro }
  Exec-Logged 'Configuration daemon (localhost tcp)' { Configure-SystemdAndDocker $Distro }
  Exec-Logged 'Démarrage & vérification Docker' { Start-DockerEngine $Distro }

  Write-Marker 'OK'
  Write-Host 'OK - Docker Engine WSL2 installé et opérationnel.' -ForegroundColor Green
  exit 0
} catch {
  $msg = $_.Exception.Message
  Write-Marker ("ERROR: " + $msg)
  Write-Host "ERREUR: $msg" -ForegroundColor Red
  exit 1
}
