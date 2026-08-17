!macro customInstall
  # Enregistrement dans StartMenuInternet (pour apparaître dans la liste des navigateurs)
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox" "" "BlueFox Browser"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities" "ApplicationDescription" "BlueFox Browser - Rapide, Stable, Gaming"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities" "ApplicationIcon" "$INSTDIR\BlueFox Browser.exe,0"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities" "ApplicationName" "BlueFox Browser"
  
  # Associations de fichiers
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities\FileAssociations" ".htm" "BlueFoxHTM"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities\FileAssociations" ".html" "BlueFoxHTM"
  
  # Associations d'URLs (Protocoles)
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities\URLAssociations" "http" "BlueFoxHTM"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities\URLAssociations" "https" "BlueFoxHTM"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\BlueFox\Capabilities\URLAssociations" "ftp" "BlueFoxHTM"
  
  # Enregistrement de l'application
  WriteRegStr HKCU "Software\RegisteredApplications" "BlueFox" "Software\Clients\StartMenuInternet\BlueFox\Capabilities"

  # Définition de la classe BlueFoxHTM pour la gestion des protocoles
  WriteRegStr HKCU "Software\Classes\BlueFoxHTM" "" "BlueFox HTML Document"
  WriteRegStr HKCU "Software\Classes\BlueFoxHTM\DefaultIcon" "" "$INSTDIR\BlueFox Browser.exe,0"
  WriteRegStr HKCU "Software\Classes\BlueFoxHTM\shell\open\command" "" '"$INSTDIR\BlueFox Browser.exe" "%1"'
!macroend

!macro customUnInstall
  # Nettoyage du registre lors de la désinstallation
  DeleteRegKey HKCU "Software\Clients\StartMenuInternet\BlueFox"
  DeleteRegValue HKCU "Software\RegisteredApplications" "BlueFox"
  DeleteRegKey HKCU "Software\Classes\BlueFoxHTM"
!macroend
