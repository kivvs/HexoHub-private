
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FolderOpen, Download, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Language, getTexts } from '@/utils/i18n';
import { isDesktopApp, getIpcRenderer, isTauri, isElectron } from '@/lib/desktop-api';
import { normalizePath } from '@/lib/utils';

interface CreateHexoDialogProps {
  onCreateSuccess?: (path: string) => void;
  children: React.ReactNode;
  language: Language;
}

interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export function CreateHexoDialog({ onCreateSuccess, children, language }: CreateHexoDialogProps) {
  const [open, setOpen] = useState(false);
  const [hexoPath, setHexoPath] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('blog');
  const [useTaobaoMirror, setUseTaobaoMirror] = useState<boolean>(true);
  const [installDeployPlugin, setInstallDeployPlugin] = useState<boolean>(true);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [hexoInstalled, setHexoInstalled] = useState<boolean>(false);
  const [hexoVersion, setHexoVersion] = useState<string>('');
  const [pnpmInstalled, setPnpmInstalled] = useState<boolean>(false);
  const [gitInstalled, setGitInstalled] = useState<boolean>(false);
  const [isCheckingEnvironment, setIsCheckingEnvironment] = useState<boolean>(true);
  const [hasWarning, setHasWarning] = useState<boolean>(false);

  const { toast } = useToast();
  const t = getTexts(language);

  // 检查环境
  useEffect(() => {
    if (open && isDesktopApp()) {
      checkEnvironment();
      // 重置警告状态
      setHasWarning(false);
    }
  }, [open]);

  const checkEnvironment = async () => {
    setIsCheckingEnvironment(true);
    setCommandOutput(t.checkingEnvironment);

    try {
      const ipcRenderer = await getIpcRenderer();

      // 检查 pnpm
      setCommandOutput(prev => prev + '\n' + t.checkingPnpm);
      const pnpmResult = await ipcRenderer.invoke('execute-command', 'pnpm -v');
      if (pnpmResult.success && pnpmResult.stdout && pnpmResult.stdout.trim()) {
        setPnpmInstalled(true);
        // 过滤掉 "Active code page: 65001" 等无关输出
        const cleanOutput = pnpmResult.stdout
          .split('\n')
          .filter(line => !line.includes('Active code page') && line.trim())
          .join('\n')
          .trim();
        setCommandOutput(prev => prev + '\n' + t.pnpmInstalled.replace('{version}', cleanOutput));
      } else {
        const errorMsg = (pnpmResult.error || pnpmResult.stderr || '命令执行失败，请确保 pnpm 已安装并在 PATH 环境变量中').trim();
        setCommandOutput(prev => prev + '\n' + t.pnpmNotInstalled.replace('{error}', errorMsg || '未知错误'));
      }

      // 检查git
      setCommandOutput(prev => prev + '\n' + t.checkingGit);
      const gitResult = await ipcRenderer.invoke('execute-command', 'git --version');
      if (gitResult.success && gitResult.stdout && gitResult.stdout.trim()) {
        setGitInstalled(true);
        // 过滤掉 "Active code page: 65001" 等无关输出
        const cleanOutput = gitResult.stdout
          .split('\n')
          .filter(line => !line.includes('Active code page') && line.trim())
          .join('\n')
          .trim();
        setCommandOutput(prev => prev + '\n' + t.gitInstalled.replace('{version}', cleanOutput));
      } else {
        const errorMsg = (gitResult.error || gitResult.stderr || '命令执行失败，请确保 git 已安装并在 PATH 环境变量中').trim();
        setCommandOutput(prev => prev + '\n' + t.gitNotInstalled.replace('{error}', errorMsg || '未知错误'));
      }

      // 检查hexo
      setCommandOutput(prev => prev + '\n' + t.checkingHexo);
      const hexoResult = await ipcRenderer.invoke('execute-command', 'hexo -v');
      if (hexoResult.success && hexoResult.stdout && hexoResult.stdout.trim()) {
        setHexoInstalled(true);
        // 过滤掉 "Active code page: 65001" 等无关输出
        const cleanOutput = hexoResult.stdout
          .split('\n')
          .filter(line => !line.includes('Active code page') && line.trim())
          .join('\n')
          .trim();
        // 提取版本号
        const versionMatch = cleanOutput.match(/hexo-cli?: ([0-9.]+)/);
        if (versionMatch) {
          setHexoVersion(versionMatch[1]);
        }
        setCommandOutput(prev => prev + '\n' + t.hexoInstalled.replace('{version}', cleanOutput));
      } else {
        const errorMsg = (hexoResult.error || hexoResult.stderr || '命令执行失败，hexo 可能未安装').trim();
        setCommandOutput(prev => prev + '\n' + t.hexoCheckNotInstalled.replace('{error}', errorMsg || '未知错误'));
      }
    } catch (error) {
      console.error('检查环境失败:', error);
      setCommandOutput(prev => prev + t.environmentCheckFailed.replace('{error}', error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCheckingEnvironment(false);
    }
  };

  const selectDirectory = async () => {
    if (!isDesktopApp()) return;

    try {
      const ipcRenderer = await getIpcRenderer();
      const selectedPath = await ipcRenderer.invoke('select-directory');

      if (selectedPath) {
        const normalizedPath = normalizePath(selectedPath);
        
        // 检查路径是否包含空格（只警告）
        if (normalizedPath.includes(' ')) {
          toast({
            title: '⚠️ 路径包含空格',
            description: '建议选择不含空格的路径，避免某些 npm 命令执行失败',
            variant: 'default',
          });
        }
        
        setHexoPath(normalizedPath);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      toast({
        title: t.selectDirectoryFailed,
        description: error instanceof Error ? error.message : t.unknownError,
        variant: 'error',
      });
    }
  };

  const createHexoProject = async () => {
    if (!isDesktopApp()) return;
    if (!pnpmInstalled) {
      toast({
        title: t.missingDependency,
        description: t.pleaseInstallPnpm,
        variant: 'error',
      });
      return;
    }
    if (!gitInstalled) {
      toast({
        title: t.missingDependency,
        description: t.pleaseInstallGit,
        variant: 'error',
      });
      return;
    }
    
    // 检查路径和文件夹名称是否包含空格（只警告，不阻止）
    const fullPath = `${hexoPath}/${folderName}`;
    if (fullPath.includes(' ')) {
      toast({
        title: '⚠️ 路径包含空格',
        description: '某些 npm 命令可能会失败。如遇问题，建议更换为不含空格的路径。',
        variant: 'default',
      });
    }

    setIsInstalling(true);
    setProgress(0);
    setCommandOutput(t.creatingHexoProject.replace('{path}', `${hexoPath}/${folderName}`));

    try {
      const ipcRenderer = await getIpcRenderer();
      // 规范化路径：统一使用正斜杠（npm 在 Windows 下也支持）
      const projectPath = normalizePath(`${hexoPath}/${folderName}`).replace(/\\/g, '/');
      // Windows cmd 命令需要引号和反斜杠
      const projectPathForCmd = projectPath.replace(/\//g, '\\');
      const projectPathQuoted = `"${projectPathForCmd}"`;

      // 设置淘宝镜像源
      if (useTaobaoMirror) {
        setProgress(10);
        setCommandOutput(prev => prev + t.settingTaobaoMirror);
        const mirrorResult = await ipcRenderer.invoke('execute-command', 'pnpm config set registry https://registry.npmmirror.com');
        if (!mirrorResult.success) {
          throw new Error(`${t.settingTaobaoMirror}: ${mirrorResult.stderr || mirrorResult.error}`);
        }
        setCommandOutput(prev => prev + t.taobaoMirrorSetSuccess);
      }

      // 安装 hexo-cli（如果未安装）
      if (!hexoInstalled) {
        setProgress(20);
        setCommandOutput(prev => prev + '\n' + t.installingHexoCli);
        const installHexoResult = await ipcRenderer.invoke('execute-command', 'pnpm add -g hexo-cli');
        if (!installHexoResult.success) {
          throw new Error(`${t.installingHexoCli}: ${installHexoResult.stderr || installHexoResult.error}`);
        }
        setCommandOutput(prev => prev + '\n' + t.hexoCliInstallSuccess + '\n' + installHexoResult.stdout);
      }

      // 创建 hexo 项目
      setProgress(40);
      setCommandOutput(prev => prev + t.creatingHexoProject.replace('{path}', projectPath));
      const initResult = await ipcRenderer.invoke('execute-command', `hexo init ${projectPath}`);
      if (!initResult.success) {
        throw new Error(`${t.creatingHexoProject}: ${initResult.stderr || initResult.error}`);
      }
      setCommandOutput(prev => prev + t.hexoProjectCreatedSuccess + '\n' + initResult.stdout);

      // 进入项目目录（hexo init已经自动安装了依赖）
      setProgress(60);
      setCommandOutput(prev => prev + t.dependenciesInstalled);

      // 安装部署插件
      if (installDeployPlugin) {
        setProgress(80);
        setCommandOutput(prev => prev + t.installingDeployPlugin);
        
        // 构建 npm install 命令（在项目目录执行）
        // 注意：使用 --prefix 参数指定工作目录，而不是使用 cd && 命令连接
        // 原因：
        // 1. Tauri 版本：execute_command 使用 cmd /C 执行，不支持 && 连接多个命令
        // 2. Electron 版本：虽然使用 PowerShell 可以支持 &&，但 npm --prefix 更可靠
        // 3. npm --prefix 是跨平台的标准参数，在所有环境下都有效
        // 
        // 路径处理说明：
        // - 在 Windows 的 cmd /C 环境中，引号会被当作路径的字面字符
        // - 对于不包含空格的路径：直接使用，不加引号
        // - 对于包含空格的路径：暂不支持（建议用户选择不含空格的路径）
        // - 使用正斜杠路径（npm 在 Windows 下也支持）
        
        const npmInstallCmd = `npm install hexo-deployer-git --save --prefix ${projectPath}`;
        
        // 尝试安装插件，如果失败则进行多次重试
        // 常见错误："Cannot read properties of null (reading 'matches')"
        // 原因：npm 10.9.3 的 @npmcli/arborist 模块在处理依赖树时的 bug
        
        let installPluginResult = await ipcRenderer.invoke('execute-command', npmInstallCmd);
        
        if (!installPluginResult.success) {
          // 第一次失败，清理 npm 缓存后重试
          // npm 缓存损坏可能导致依赖解析失败
          setCommandOutput(prev => prev + '\n第一次安装失败，清理 npm 缓存后重试...\n');
          await ipcRenderer.invoke('execute-command', 'npm cache clean --force');
          installPluginResult = await ipcRenderer.invoke('execute-command', npmInstallCmd);
          
          if (!installPluginResult.success) {
            // 仍然失败，尝试使用官方源重新安装
            // 淘宝镜像可能存在同步延迟或包不完整的问题
            setCommandOutput(prev => prev + '\n仍然失败，尝试使用官方源重新安装...\n');
            await ipcRenderer.invoke('execute-command', 'npm config set registry https://registry.npmjs.org/');
            installPluginResult = await ipcRenderer.invoke('execute-command', npmInstallCmd);
            
            if (!installPluginResult.success) {
              // 最后尝试：删除 node_modules 和 package-lock.json，重新安装
              setCommandOutput(prev => prev + '\n尝试清理项目依赖后重新安装...\n');
              
              // 使用 Windows cmd 原生命令删除文件/目录
              // 注意：这里每个命令单独执行，不使用 && 连接
              // 原因：
              // 1. 避免 "文件名、目录名或卷标语法不正确" 错误
              // 2. cmd /C 只能执行单个命令或简单的命令组合
              // 3. if exist 确保文件存在才删除，避免不必要的错误
              
              // 删除 node_modules 目录
              // /s 删除目录及其所有子目录和文件
              // /q 安静模式，不要求确认
              await ipcRenderer.invoke('execute-command', `if exist ${projectPathQuoted}\\node_modules rmdir /s /q ${projectPathQuoted}\\node_modules`);
              
              // 删除 package-lock.json 文件
              // /f 强制删除只读文件
              // /q 安静模式
              await ipcRenderer.invoke('execute-command', `if exist ${projectPathQuoted}\\package-lock.json del /f /q ${projectPathQuoted}\\package-lock.json`);
              
              // 重新安装所有依赖（解决 npm 依赖树损坏问题）
              // 不使用引号，避免引号被当作路径的字面字符
              await ipcRenderer.invoke('execute-command', `npm install --prefix ${projectPath}`);
              
              // 再次尝试安装插件
              installPluginResult = await ipcRenderer.invoke('execute-command', npmInstallCmd);
              
              // 恢复淘宝镜像设置（如果之前使用了）
              if (useTaobaoMirror) {
                await ipcRenderer.invoke('execute-command', 'npm config set registry https://registry.npmmirror.com');
              }
              
              if (!installPluginResult.success) {
                // 所有重试方法都失败了
                // 这通常是 npm 10.9.3 的 @npmcli/arborist bug 导致的
                // 不要阻止项目创建，而是给出警告和手动安装指引
                const errorMsg = installPluginResult.stderr || installPluginResult.error || '未知错误';
                const isArboristBug = errorMsg.includes("Cannot read properties of null (reading 'matches')");
                
                let warningMsg = '\n⚠️ 部署插件自动安装失败\n';
                if (isArboristBug) {
                  warningMsg += '\n这是 npm 10.9.3 的已知 bug。\n';
                  warningMsg += '建议解决方案：\n';
                  warningMsg += '1. 升级 npm: npm install -g npm@latest\n';
                  warningMsg += '2. 或降级到稳定版: npm install -g npm@10.8.2\n';
                  warningMsg += '3. 然后手动安装插件:\n';
                  warningMsg += `   cd ${projectPath}\n`;
                  warningMsg += '   npm install hexo-deployer-git --save\n';
                } else {
                  warningMsg += `错误信息: ${errorMsg}\n\n`;
                  warningMsg += '手动安装方法：\n';
                  warningMsg += `cd ${projectPath}\n`;
                  warningMsg += 'npm install hexo-deployer-git --save\n';
                }
                
                setCommandOutput(prev => prev + warningMsg);
                
                // 标记有警告，阻止自动关闭对话框
                setHasWarning(true);
                
                // 显示警告 toast，但不阻止流程
                toast({
                  title: '⚠️ 插件安装失败',
                  description: isArboristBug 
                    ? 'npm 版本 bug，请手动安装 hexo-deployer-git' 
                    : '请手动安装 hexo-deployer-git 插件',
                  variant: 'default',
                });
                
                // 继续执行，不要抛出错误
              }
            }
          }
        }
        
        // 无论安装是否成功，都输出结果信息
        if (installPluginResult.success) {
          setCommandOutput(prev => prev + t.deployPluginInstallSuccess + '\n' + installPluginResult.stdout);
        }
      }

      setProgress(100);
      setCommandOutput(prev => prev + t.hexoProjectCreationComplete);

      toast({
        title: t.createSuccess,
        description: t.hexoProjectCreatedSuccessfully,
        variant: 'success',
      });

      // 通知父组件
      if (onCreateSuccess) {
        onCreateSuccess(projectPath);
      }

      // 如果没有警告，才自动关闭对话框
      // 如果有警告，让用户手动关闭，以便查看完整的输出信息
      if (!hasWarning) {
        setTimeout(() => setOpen(false), 1500);
      }
    } catch (error) {
      console.error('创建 Hexo 项目失败:', error);
      setCommandOutput(prev => prev + `${t.createFailed}: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: t.createFailed,
        description: error instanceof Error ? error.message : t.unknownError,
        variant: 'error',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            {t.createHexoProject}
          </DialogTitle>
          <DialogDescription>
            {t.createHexoProjectDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isCheckingEnvironment ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <Info className="w-4 h-4 mr-2" />
                {t.checkingEnvironment}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono h-32 overflow-y-auto whitespace-pre-wrap">
                {commandOutput}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {npmInstalled && gitInstalled ? (
                      hexoInstalled ? (
                        t.hexoAlreadyInstalled.replace('{version}', hexoVersion)
                      ) : (
                        t.hexoNotInstalled
                      )
                    ) : (
                      t.installNpmAndGitFirst
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-1">
                  <Label htmlFor="hexo-path">{t.hexoProjectLocation}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="hexo-path"
                      value={hexoPath}
                      placeholder={t.selectDirectory}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectDirectory}
                      disabled={isInstalling}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="folder-name">{t.projectFolderName}</Label>
                  <Input
                    id="folder-name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="blog"
                    disabled={isInstalling}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taobao-mirror"
                    checked={useTaobaoMirror}
                    onCheckedChange={(checked) => setUseTaobaoMirror(!!checked)}
                    disabled={isInstalling}
                  />
                  <Label htmlFor="taobao-mirror">{t.useTaobaoMirrorRecommended}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deploy-plugin"
                    checked={installDeployPlugin}
                    onCheckedChange={(checked) => setInstallDeployPlugin(!!checked)}
                    disabled={isInstalling}
                  />
                  <Label htmlFor="deploy-plugin">{t.installDeployPluginDescription}</Label>
                </div>
              </div>

              {isInstalling && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t.installationProgress}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono h-48 overflow-y-auto whitespace-pre-wrap">
                {commandOutput || t.commandOutput}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isInstalling}
          >
            {isCheckingEnvironment ? t.cancel : t.close}
          </Button>
          {!isCheckingEnvironment && (
            <Button
              onClick={createHexoProject}
              disabled={isInstalling || !hexoPath || !npmInstalled || !gitInstalled}
            >
              {isInstalling ? t.creating : t.createProject}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
