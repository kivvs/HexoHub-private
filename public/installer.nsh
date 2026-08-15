; ============================================
; NSIS 安装程序钩子脚本 - HexoHub (Tauri)
; ============================================

!include "LogicLib.nsh"

; 全局变量
Var NodeJsDetected
Var NodeJsPath

; ============================================
; 安装前钩子 - 检测 Node.js
; ============================================
!macro NSIS_HOOK_PREINSTALL
  ; 默认展开详细信息面板，让用户看到检测过程
  SetDetailsView show
  
  DetailPrint "======================================"
  DetailPrint "正在检查系统环境..."
  DetailPrint "======================================"
  DetailPrint ""
  
  ; 检测 Node.js
  StrCpy $NodeJsDetected "0"
  StrCpy $NodeJsPath ""
  
  DetailPrint "[检测] 正在检查 Node.js 安装状态..."
  
  ; 检查 HKLM
  ReadRegStr $NodeJsPath HKLM "SOFTWARE\Node.js" "InstallPath"
  ${If} $NodeJsPath != ""
    StrCpy $NodeJsDetected "1"
    DetailPrint "[成功] ✓ Node.js 已安装"
    DetailPrint "       路径: $NodeJsPath"
  ${Else}
    ; 检查 HKCU
    ReadRegStr $NodeJsPath HKCU "SOFTWARE\Node.js" "InstallPath"
    ${If} $NodeJsPath != ""
      StrCpy $NodeJsDetected "1"
      DetailPrint "[成功] ✓ Node.js 已安装"
      DetailPrint "       路径: $NodeJsPath"
    ${Else}
      DetailPrint "[警告] ⚠ 未检测到 Node.js"
      DetailPrint "       HexoHub 需要 Node.js 才能管理 Hexo 博客"
      DetailPrint "       请访问 https://nodejs.org 下载安装"
    ${EndIf}
  ${EndIf}
  
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "环境检查完成，开始安装 HexoHub..."
  DetailPrint "======================================"
!macroend

; ============================================
; 安装后钩子
; ============================================
!macro NSIS_HOOK_POSTINSTALL
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "正在完成安装配置..."
  DetailPrint "======================================"
  DetailPrint ""
  
  ; 写入版本信息到注册表
  WriteRegStr SHCTX "Software\HexoHub" "Version" "${VERSION}"
  WriteRegStr SHCTX "Software\HexoHub" "InstallDate" "$INSTDATE"
  DetailPrint "[配置] 写入注册表信息"
  
  ; 可选：关联 .md 文件（取消注释以启用）
  ; WriteRegStr SHCTX "Software\Classes\.md" "" "HexoHub.Markdown"
  ; WriteRegStr SHCTX "Software\Classes\HexoHub.Markdown" "" "Markdown 文档"
  ; WriteRegStr SHCTX "Software\Classes\HexoHub.Markdown\DefaultIcon" "" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  ; WriteRegStr SHCTX "Software\Classes\HexoHub.Markdown\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  ; DetailPrint "[配置] 设置文件关联"
  
  ; 如果没有检测到 Node.js，写入标记并显示重要提示
  ${If} $NodeJsDetected == "0"
    WriteRegStr SHCTX "Software\HexoHub" "NodeJsWarning" "1"
    DetailPrint ""
    DetailPrint "[警告] ⚠ 系统未安装 Node.js"
    DetailPrint "       安装完成后将显示重要提示"
    DetailPrint ""
    
    ; 这是重要提示，需要弹窗告知用户
    MessageBox MB_ICONEXCLAMATION|MB_OK \
      "⚠️ 重要提示$\n$\n\
      系统未检测到 Node.js 安装。$\n$\n\
      HexoHub 需要 Node.js 才能管理 Hexo 博客。$\n$\n\
      请访问 https://nodejs.org 下载安装 Node.js（建议 v20 或更高版本）。$\n$\n\
      安装 Node.js 后即可正常使用 HexoHub。"
  ${Else}
    DetailPrint "[成功] ✓ 环境检查通过，Node.js 已就绪"
  ${EndIf}
  
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "🎉 HexoHub 安装成功！Enjoy yourself~"
  DetailPrint "======================================"
!macroend

; ============================================
; 卸载前钩子
; ============================================
!macro NSIS_HOOK_PREUNINSTALL
  ; 默认展开详细信息面板
  SetDetailsView show
  
  DetailPrint "======================================"
  DetailPrint "正在准备卸载 HexoHub..."
  DetailPrint "======================================"
!macroend

; ============================================
; 卸载后钩子
; ============================================
!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "正在清理系统..."
  DetailPrint "======================================"
  DetailPrint ""
  
  ; 确保使用当前用户的 AppData 路径
  SetShellVarContext current
  
  ; Tauri 的卸载界面已经有"删除用户数据"的选项
  ; 这里只需要清理注册表和文件关联
  DetailPrint "[配置] 清理注册表..."
  
  ; 清理注册表
  DeleteRegKey SHCTX "Software\HexoHub"
  
  ; 清理文件关联（前面没启用这里就不用）
  ; DeleteRegKey SHCTX "Software\Classes\.md"
  ; DeleteRegKey SHCTX "Software\Classes\HexoHub.Markdown"
  
  DetailPrint "[成功] ✓ 注册表已清理"
  
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "✓ 您的 Hexo 博客项目文件已完整保留"
  DetailPrint "👋 感谢你使用 HexoHub！"
  DetailPrint ""
  DetailPrint "💡 有任何建议或问题？欢迎访问："
  DetailPrint "   https://github.com/kivvs/HexoHub-private/issues"
  DetailPrint "======================================"
!macroend
