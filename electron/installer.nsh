; Node Orchestrator NSIS Installer Script
; Version 1.0.0 - Offline Installer

!macro customHeader
  !system "echo 'Building Node Orchestrator v1.0.0 Installer...'"
!macroend

!macro preInit
  ; Set install directory
  SetRegView 64
!macroend

!macro customInit
  ; Custom initialization
!macroend

!macro customInstall
  ; Create data directory
  CreateDirectory "$APPDATA\node-orchestrator"
  CreateDirectory "$APPDATA\node-orchestrator\data"
  CreateDirectory "$APPDATA\node-orchestrator\data\nodes"
  CreateDirectory "$APPDATA\node-orchestrator\data\wallets"
  
  ; Write version info
  FileOpen $0 "$APPDATA\node-orchestrator\version.txt" w
  FileWrite $0 "1.0.0"
  FileClose $0
!macroend

!macro customUnInstall
  ; Clean up app data (optional - ask user)
  MessageBox MB_YESNO "Voulez-vous supprimer les données de l'application (nodes, wallets) ?" IDNO skip_data_removal
    RMDir /r "$APPDATA\node-orchestrator"
  skip_data_removal:
!macroend
