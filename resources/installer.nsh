!macro customInit
  ; $R0 用于存储旧版本卸载路径， $R1 用于存储旧版本号
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app" "UninstallString"
  ReadRegStr $R1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app" "DisplayVersion"

  ${If} $R0 == ""
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app" "UninstallString"
    ReadRegStr $R1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.mditor.app" "DisplayVersion"
  ${EndIf}

  ${If} $R0 != ""
    ; 检测到已安装旧版本，友好弹窗告知用户将自动清理旧版程序文件并保留数据
    ${If} $R1 != ""
      MessageBox MB_YESNO|MB_ICONINFORMATION "检测到您的电脑上已安装 mditor (v$R1)。$\r$\n$\r$\n安装程序将在升级前自动为您清理旧版本程序文件，您的文档数据与个人设置将完好保留。$\r$\n$\r$\n是否继续安装更新？" IDYES continue_update IDNO abort_update
    ${Else}
      MessageBox MB_YESNO|MB_ICONINFORMATION "检测到您的电脑上已安装 mditor 旧版本。$\r$\n$\r$\n安装程序将在升级前自动为您清理旧版本程序文件，您的文档数据与个人设置将完好保留。$\r$\n$\r$\n是否继续安装更新？" IDYES continue_update IDNO abort_update
    ${EndIf}
    abort_update:
      Quit
    continue_update:
  ${EndIf}
!macroend
