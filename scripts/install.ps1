# ===========================================
# Script d'installation Node Orchestrator
# Pour Windows PowerShell
# ===========================================

Write-Host "🚀 Installation de Node Orchestrator..." -ForegroundColor Cyan
Write-Host ""

# Vérifier les prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 20) {
        Write-Host "❌ Node.js version 20+ requise. Version actuelle: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé. Veuillez installer Node.js 20+" -ForegroundColor Red
    exit 1
}

# npm
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé." -ForegroundColor Red
    exit 1
}

# Docker (optionnel)
try {
    $dockerVersion = docker -v
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker non détecté. Installation manuelle requise pour les nodes." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host ""
Write-Host "⚙️  Configuration..." -ForegroundColor Yellow

# Créer le fichier .env s'il n'existe pas
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    
    # Générer des clés aléatoires
    $encryptionKey = -join ((48..57) + (97..102) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $jwtSecret = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    
    # Lire et remplacer dans le fichier .env
    $envContent = Get-Content .env -Raw
    $envContent = $envContent -replace 'your-32-char-encryption-key-here', $encryptionKey
    $envContent = $envContent -replace 'your-jwt-secret-key', $jwtSecret
    Set-Content .env $envContent
    
    Write-Host "✅ Fichier .env créé avec des clés générées" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Fichier .env existant conservé" -ForegroundColor Cyan
}

# Créer les dossiers de données
New-Item -ItemType Directory -Force -Path data/nodes | Out-Null
New-Item -ItemType Directory -Force -Path data/wallets | Out-Null
New-Item -ItemType Directory -Force -Path data/logs | Out-Null
Write-Host "✅ Dossiers de données créés" -ForegroundColor Green

Write-Host ""
Write-Host "🏗️  Build du projet..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Installation terminée !" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour lancer l'application:" -ForegroundColor White
Write-Host ""
Write-Host "  Mode Production:" -ForegroundColor Yellow
Write-Host "    npm start" -ForegroundColor White
Write-Host ""
Write-Host "  Mode Développement:" -ForegroundColor Yellow
Write-Host "    npm run dev" -ForegroundColor White
Write-Host "    cd frontend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Avec Docker:" -ForegroundColor Yellow
Write-Host "    docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "L'application sera disponible sur http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
