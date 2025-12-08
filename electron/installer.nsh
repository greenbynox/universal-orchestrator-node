; Node Orchestrator NSIS Installer Script
; Version 1.0.5 - With Smart Hardware Wallet Dependencies Detection

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

; ============================================================
; Variables
; ============================================================
Var hwWalletCheckbox
Var hwWalletPage
Var installCppTools
Var cppToolsInstalled
Var cppToolsStatus

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
  
  !insertmacro MUI_HEADER_TEXT "Dépendances Hardware Wallet" "Vérification des outils C++"
  
  nsDialogs::Create 1018
  Pop $hwWalletPage
  
  ${If} $hwWalletPage == error
    Abort
  ${EndIf}
  
  ${NSD_CreateLabel} 0 0 100% 50u "Node Orchestrator peut utiliser des hardware wallets (Ledger, Trezor).$\n$\nÉtat des outils C++ : $cppToolsStatus"
  
  ; Show checkbox only if tools are NOT installed
  ${If} $cppToolsInstalled == "0"
    ${NSD_CreateLabel} 0 60u 100% 25u "Installer Visual Studio Build Tools (Recommandé)"
    Pop $hwWalletCheckbox
    ${NSD_Check} $hwWalletCheckbox
    
    ${NSD_CreateLabel} 10 80 280 40 "⏱️ Téléchargement : ~5-10 MB (rapide)$\nInstallation : ~5-10 minutes$\nEspace disque requis : ~300-400 MB$\n$\nSans cette installation, vous ne pourrez pas utiliser Ledger/Trezor."
  ${Else}
    ${NSD_CreateLabel} 0 60u 100% 80u "✅ Visual Studio Build Tools est déjà installé sur votre système !$\n$\nVous pouvez utiliser :"
    ${NSD_CreateLabel} 0 145u 100% 30u "  ✓ Ledger Hardware Wallet$\n  ✓ Trezor Hardware Wallet$\n  ✓ Toutes les autres fonctionnalités"
    StrCpy $installCppTools "0"
  ${EndIf}
  
  nsDialogs::Show
FunctionEnd

Function hwWalletPageLeave
  ${If} $cppToolsInstalled == "0"
    ${NSD_GetState} $hwWalletCheckbox $installCppTools
    
    ${If} $installCppTools == 1
      MessageBox MB_OKCANCEL "Visual Studio Build Tools sera téléchargé et installé.$\n$\nCliquez OK pour continuer." IDOK continue_install
        Abort
      continue_install:
    ${Else}
      MessageBox MB_YESNO "Vous avez décidé de ne pas installer les outils C++.$\n$\nVous pourrez toujours utiliser Node Orchestrator, mais pas Ledger/Trezor.$\n$\nContinuer ?" IDYES skip_cpp
        Abort
      skip_cpp:
    ${EndIf}
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
