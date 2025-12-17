; Node Orchestrator NSIS Installer Script
; Version 1.0.5 - With Smart Hardware Wallet Dependencies Detection

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

; Paths (compile-time)
!define PROJECT_DIR "${__FILEDIR__}\\.."
!define DOCKER_WSL_INSTALL_PS1 "${PROJECT_DIR}\\scripts\\install-docker-engine-wsl.ps1"

; ============================================================
; Variables
; ============================================================
Var hwWalletCheckbox
Var hwWalletPage
Var installCppTools
Var cppToolsInstalled
Var cppToolsStatus

; Variables for Docker
Var dockerInstalled
Var dockerStatus
Var dockerCheckbox
Var installDocker

!macro customHeader
  !system "echo 'Building Node Orchestrator v2.2.0 Installer...'"
!macroend

!macro preInit
  ; Set install directory
  SetRegView 64
!macroend

!macro customInit
  ; Custom page for Hardware Wallet dependencies
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_DIRECTORY
  Page custom hwWalletPageCreate hwWalletPageLeave
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
!macroend

; ============================================================
; Function to check if Docker is installed
; ============================================================
Function checkDockerInstalled
  StrCpy $dockerInstalled "0"
  StrCpy $dockerStatus "Non détecté"

  ; Prefer WSL2 Docker Engine detection
  IfFileExists "$SYSDIR\wsl.exe" 0 +7
    ; Try to run docker inside default WSL distro (silent)
    ExecWait '"$SYSDIR\wsl.exe" -e sh -lc "docker info >/dev/null 2>&1"' $0
    ${If} $0 == 0
      StrCpy $dockerInstalled "1"
      StrCpy $dockerStatus "Détecté (Docker Engine WSL2)"
      Return
    ${EndIf}

  ; Check Registry
  ReadRegStr $0 HKLM "SOFTWARE\Docker Inc.\Docker\1.0" "AppPath"
  ${If} $0 != ""
    StrCpy $dockerInstalled "1"
    StrCpy $dockerStatus "Détecté (Docker Desktop)"
    Return
  ${EndIf}
  
  ; Check File
  IfFileExists "$PROGRAMFILES\Docker\Docker\Docker Desktop.exe" 0 +3
    StrCpy $dockerInstalled "1"
    StrCpy $dockerStatus "Détecté (Docker Desktop)"
FunctionEnd

; ============================================================
; Function to check if Visual Studio Build Tools is installed
; ============================================================
Function checkVSBuildTools
  StrCpy $cppToolsInstalled "0"
  StrCpy $cppToolsStatus "Non installé"
  
  ; Check Registry for Visual Studio Build Tools 2022
  ReadRegStr $0 HKLM "Software\Microsoft\VisualStudio\17.0_Config" "InstallationPath"
  ${If} $0 != ""
    StrCpy $cppToolsInstalled "1"
    StrCpy $cppToolsStatus "Détecté (VS 2022)"
    Return
  ${EndIf}
  
  ; Check Registry for Visual Studio Build Tools 2019
  ReadRegStr $0 HKLM "Software\Microsoft\VisualStudio\16.0_Config" "InstallationPath"
  ${If} $0 != ""
    StrCpy $cppToolsInstalled "1"
    StrCpy $cppToolsStatus "Détecté (VS 2019)"
    Return
  ${EndIf}
  
  ; Check if C++ build tools are accessible via PATH
  FindFirst $0 $1 "$SYSDIR\cl.exe"
  FindClose $0
  ${If} $0 != ""
    StrCpy $cppToolsInstalled "1"
    StrCpy $cppToolsStatus "Détecté (sur le système)"
    Return
  ${EndIf}
FunctionEnd

; ============================================================
; Hardware Wallet Dependencies Page
; ============================================================
Function hwWalletPageCreate
  Call checkVSBuildTools
  Call checkDockerInstalled
  
  !insertmacro MUI_HEADER_TEXT "Dépendances Requises" "Vérification de Docker et des outils C++"
  
  nsDialogs::Create 1018
  Pop $hwWalletPage
  
  ${If} $hwWalletPage == error
    Abort
  ${EndIf}
  
  ; --- Docker Section ---
  ${NSD_CreateLabel} 0 0 100% 12u "Docker (Requis pour les nodes) : $dockerStatus"
  
  ${If} $dockerInstalled == "0"
    ${NSD_CreateCheckbox} 0 15u 100% 12u "Installer Docker Engine (WSL2) (Recommandé)"
    Pop $dockerCheckbox
    ${NSD_Check} $dockerCheckbox
    
    ${NSD_CreateLabel} 10 30u 90% 35u "Sans Docker, vous ne pourrez pas lancer de nodes.$\nInstallation via WSL2 (léger, sans Docker Desktop).$\nUn redémarrage Windows peut être nécessaire."
  ${Else}
    ${NSD_CreateLabel} 0 15u 100% 12u "✅ Docker est déjà installé."
    StrCpy $installDocker "0"
  ${EndIf}

  ; --- VS Tools Section ---
  ${NSD_CreateLabel} 0 65u 100% 12u "Outils C++ (Requis pour Ledger/Trezor) : $cppToolsStatus"
  
  ${If} $cppToolsInstalled == "0"
    ${NSD_CreateCheckbox} 0 80u 100% 12u "Installer Visual Studio Build Tools (Recommandé)"
    Pop $hwWalletCheckbox
    ${NSD_Check} $hwWalletCheckbox
    
    ${NSD_CreateLabel} 10 95u 90% 35u "Nécessaire pour la compatibilité Hardware Wallet.$\nTéléchargement : ~10 MB, Installation : ~5 min."
  ${Else}
    ${NSD_CreateLabel} 0 80u 100% 12u "✅ Outils C++ déjà installés."
    StrCpy $installCppTools "0"
  ${EndIf}
  
  nsDialogs::Show
FunctionEnd

Function hwWalletPageLeave
  ; Get Docker Checkbox State
  ${If} $dockerInstalled == "0"
    ${NSD_GetState} $dockerCheckbox $installDocker
  ${EndIf}

  ; Get VS Tools Checkbox State
  ${If} $cppToolsInstalled == "0"
    ${NSD_GetState} $hwWalletCheckbox $installCppTools
  ${EndIf}
FunctionEnd

!macro customInstall
  ; Create data directory
  CreateDirectory "$APPDATA\node-orchestrator"
  CreateDirectory "$APPDATA\node-orchestrator\data"
  CreateDirectory "$APPDATA\node-orchestrator\data\nodes"
  CreateDirectory "$APPDATA\node-orchestrator\data\wallets"
  
  ; Write version info
  FileOpen $0 "$APPDATA\node-orchestrator\version.txt" w
  FileWrite $0 "2.2.0"
  FileClose $0
  
  ; Install Docker if requested
  ${If} $installDocker == 1
    DetailPrint "Installation de Docker Engine (WSL2)..."
    DetailPrint "Cela peut prendre plusieurs minutes et peut demander un redémarrage Windows."
    SetDetailsPrint both

    ; Extract installer script to TEMP
    File /oname=$TEMP\install-docker-engine-wsl.ps1 "${DOCKER_WSL_INSTALL_PS1}"
    Delete "$TEMP\node-orchestrator-docker-wsl.done"

    ; Run elevated (UAC)
    DetailPrint "Demande d'élévation (UAC) pour installer WSL2/Docker Engine..."
    ExecShell "runas" "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" '-NoProfile -ExecutionPolicy Bypass -File "$TEMP\\install-docker-engine-wsl.ps1"'

    ; Wait for marker file (max ~20 minutes)
    StrCpy $1 0
    loop_wait_docker:
      Sleep 2000
      IntOp $1 $1 + 2
      IfFileExists "$TEMP\node-orchestrator-docker-wsl.done" done_wait_docker
      ${If} $1 > 1200
        Goto timeout_wait_docker
      ${EndIf}
      Goto loop_wait_docker

    timeout_wait_docker:
      DetailPrint "⚠️ Timeout: installation Docker Engine (WSL2) trop longue ou annulée."
      Goto end_docker_install

    done_wait_docker:
      FileOpen $0 "$TEMP\node-orchestrator-docker-wsl.done" r
      FileRead $0 $2
      FileClose $0

      ; Normalize (remove trailing CR/LF)
      StrCpy $3 $2 15

      ${If} $3 == "REBOOT_REQUIRED"
        DetailPrint "⚠️ Redémarrage requis pour finaliser WSL2."
        SetRebootFlag true
        MessageBox MB_ICONEXCLAMATION|MB_OK "WSL2 a été activé. Veuillez redémarrer Windows puis relancer Node Orchestrator."
      ${ElseIf} $2 == "OK$\r$\n"
        DetailPrint "✅ Docker Engine (WSL2) installé et prêt."
      ${ElseIf} $2 == "OK$\n"
        DetailPrint "✅ Docker Engine (WSL2) installé et prêt."
      ${ElseIf} $2 == "OK"
        DetailPrint "✅ Docker Engine (WSL2) installé et prêt."
      ${Else}
        DetailPrint "⚠️ Installation Docker Engine (WSL2) terminée avec message: $2"
        MessageBox MB_ICONSTOP|MB_OK "L'installation Docker Engine (WSL2) a échoué ou a été annulée.$\nDétail: $2"
      ${EndIf}

    end_docker_install:
      Delete "$TEMP\install-docker-engine-wsl.ps1"
      ; Keep marker for debugging if needed
  ${EndIf}
  
  ; Install Visual Studio Build Tools if requested and not already installed
  ${If} $installCppTools == 1
    DetailPrint "Téléchargement de la dernière version de Visual Studio Build Tools..."
    SetDetailsPrint both
    
    ; Download latest VS Build Tools installer (2022)
    ; Using the latest redirected URL from Microsoft
    NSCurl::http get "https://aka.ms/vs/17/release/vs_BuildTools.exe" "$TEMP\vs_BuildTools.exe"
    Pop $0
    
    ${If} $0 == 0
      DetailPrint "Installation de Visual Studio Build Tools..."
      DetailPrint "Cela peut prendre 2-3 minutes..."
      
      ; Silent installation with Desktop development with C++ workload
      ; --add = add workload
      ; --includeRecommended = include recommended components
      ; --passive = show progress, no interaction needed
      ; --norestart = don't restart after installation
      ExecWait "$TEMP\vs_BuildTools.exe --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended --passive --norestart --wait"
      
      Delete "$TEMP\vs_BuildTools.exe"
      DetailPrint "✅ Visual Studio Build Tools installé avec succès!"
    ${Else}
      DetailPrint "⚠️ Impossible de télécharger Visual Studio Build Tools (erreur: $0)"
      DetailPrint "Vous pouvez l'installer manuellement depuis:"
      DetailPrint "https://visualstudio.microsoft.com/downloads/"
      DetailPrint ""
      DetailPrint "L'application fonctionnera, mais Ledger/Trezor ne seront pas disponibles."
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnInstall
  ; Clean up app data (optional - ask user)
  MessageBox MB_YESNO "Voulez-vous supprimer les données de l'application (nodes, wallets) ?" IDNO skip_data_removal
    RMDir /r "$APPDATA\node-orchestrator"
  skip_data_removal:
!macroend
