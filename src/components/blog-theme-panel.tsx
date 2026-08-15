'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  RefreshCw,
  Check,
  FolderGit2,
  Package,
  Sparkles,
  Rocket,
  TriangleAlert,
  Download,
  Globe,
  Loader2,
} from 'lucide-react';
import { getIpcRenderer, isDesktopApp } from '@/lib/desktop-api';
import { fetchHexoThemeCatalog, toSshUrl, type HexoThemeInfo } from '@/lib/hexo-themes-catalog';

interface BlogThemePanelProps {
  hexoPath: string;
  language?: 'zh' | 'en';
}

interface ThemeEntry {
  name: string;
  configName: string;
  source: 'themes' | 'node_modules';
  hasPackageJson: boolean;
  packageName?: string;
  version?: string;
  isValidHexo: boolean;
  frameworkHint?: string;
}

export function BlogThemePanel({ hexoPath, language = 'zh' }: BlogThemePanelProps) {
  const [themes, setThemes] = useState<ThemeEntry[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [isLoadingThemes, setIsLoadingThemes] = useState<boolean>(false);
  const [isReadingConfig, setIsReadingConfig] = useState<boolean>(false);
  const [switchingTheme, setSwitchingTheme] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  // 远程主题目录
  const [catalog, setCatalog] = useState<HexoThemeInfo[]>([]);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [catalogProgress, setCatalogProgress] = useState<{ done: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('installed');
  // 下载安装中状态
  const [installingTheme, setInstallingTheme] = useState<string | null>(null);
  const [installLog, setInstallLog] = useState<string>('');

  const zh = language === 'zh';

  const stripHexoThemePrefix = (name: string): string => name.replace(/^hexo-theme-/i, '');

  const readCurrentTheme = async () => {
    if (!isDesktopApp() || !hexoPath) return '';
    setIsReadingConfig(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      const configPath = `${hexoPath}/_config.yml`;
      const content = await ipcRenderer.invoke('read-file', configPath);
      const match = content.match(/^theme:\s*["']?([^"'#\s]+)/m);
      return match ? match[1].trim() : '';
    } catch (error) {
      console.error('读取博客主题配置失败:', error);
      return '';
    } finally {
      setIsReadingConfig(false);
    }
  };

  const isThemeActive = (entry: ThemeEntry, rawCurrent: string): boolean => {
    if (!rawCurrent) return false;
    if (entry.configName === rawCurrent) return true;
    if (entry.name === rawCurrent) return true;
    if (stripHexoThemePrefix(entry.configName) === stripHexoThemePrefix(rawCurrent)) return true;
    return false;
  };

  const readPackageInfo = async (
    ipcRenderer: any,
    pkgPath: string,
    fallbackName: string
  ): Promise<{ hasPackageJson: boolean; packageName?: string; version?: string }> => {
    try {
      const pkgContent = await ipcRenderer.invoke('read-file', pkgPath);
      try {
        const pkg = JSON.parse(pkgContent);
        return { hasPackageJson: true, packageName: pkg.name || fallbackName, version: pkg.version };
      } catch {
        return { hasPackageJson: true, packageName: fallbackName };
      }
    } catch {
      return { hasPackageJson: false, packageName: fallbackName };
    }
  };

  const inspectTheme = async (
    ipcRenderer: any,
    dirPath: string,
    name: string,
    source: 'themes' | 'node_modules'
  ): Promise<ThemeEntry> => {
    const info = await readPackageInfo(ipcRenderer, `${dirPath}/package.json`, name);
    let hasLayout = false;
    let hasEjsOrPug = false;
    let frameworkHint: string | undefined;
    try {
      const files = await ipcRenderer.invoke('list-files', dirPath);
      const names = files.map((f: any) => f.name.toLowerCase());
      hasLayout = names.includes('layout');
      hasEjsOrPug = names.some((n: string) => n.endsWith('.ejs') || n.endsWith('.pug') || n.endsWith('.njk'));
      if (names.includes('gatsby-config.js') || names.includes('gatsby-node.js') || names.includes('gatsby-browser.js')) {
        frameworkHint = 'Gatsby 主题（非 Hexo，无法使用）';
      } else if (names.includes('hugo.toml') || names.includes('hugo.yaml') || names.includes('config.toml')) {
        frameworkHint = 'Hugo 主题（非 Hexo，无法使用）';
      } else if (names.includes('vitepress') || names.includes('docs/.vitepress')) {
        frameworkHint = 'VitePress（非 Hexo，无法使用）';
      } else if (names.includes('_config.yml') && !hasLayout) {
        frameworkHint = '缺少 layout/ 模板目录';
      }
    } catch {
      // 忽略
    }
    const isValidHexo = hasLayout || hasEjsOrPug;
    return {
      name,
      configName: name,
      source,
      isValidHexo,
      frameworkHint: frameworkHint || (isValidHexo ? undefined : '不是有效的 Hexo 主题'),
      ...info,
    };
  };

  const loadThemes = async () => {
    if (!isDesktopApp() || !hexoPath) {
      setMessage({ success: false, text: zh ? '请先选择有效的 Hexo 项目' : 'Select a valid Hexo project first' });
      return;
    }
    setIsLoadingThemes(true);
    setMessage(null);
    try {
      const ipcRenderer = await getIpcRenderer();
      const themesPath = `${hexoPath}/themes`;
      const nodeModulesPath = `${hexoPath}/node_modules`;
      const themeMap = new Map<string, ThemeEntry>();

      try {
        const themesFiles = await ipcRenderer.invoke('list-files', themesPath);
        const themesDirs = themesFiles.filter((file: any) => file.isDirectory && !file.name.startsWith('.'));
        for (const dir of themesDirs) {
          const key = stripHexoThemePrefix(dir.name);
          if (themeMap.has(key)) continue;
          const entry = await inspectTheme(ipcRenderer, `${themesPath}/${dir.name}`, dir.name, 'themes');
          themeMap.set(key, entry);
        }
      } catch {
        // 忽略
      }

      try {
        const nodeModulesFiles = await ipcRenderer.invoke('list-files', nodeModulesPath);
        const npmThemes = nodeModulesFiles.filter(
          (file: any) => file.isDirectory && /^hexo-theme-/.test(file.name)
        );
        for (const dir of npmThemes) {
          const shortName = stripHexoThemePrefix(dir.name);
          if (themeMap.has(shortName)) continue;
          const entry = await inspectTheme(ipcRenderer, `${nodeModulesPath}/${dir.name}`, shortName, 'node_modules');
          themeMap.set(shortName, entry);
        }
      } catch {
        // 忽略
      }

      setThemes(Array.from(themeMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')));
      setCurrentTheme(await readCurrentTheme());
    } catch (error) {
      console.warn('扫描博客主题失败:', error);
      setThemes([]);
      setMessage({ success: false, text: zh ? '扫描主题失败，请确认 themes 目录或 node_modules 存在' : 'Failed to scan themes' });
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // 执行 hexo 命令（clean/generate 等），返回结果
  const runHexoCommand = async (ipcRenderer: any, command: string) => {
    return await ipcRenderer.invoke('execute-hexo-command', command, hexoPath);
  };

  // 自动回滚：把 _config.yml 的 theme 写回原值，并重新生成恢复站点
  const rollbackTheme = async (ipcRenderer: any, configPath: string, prevRaw: string) => {
    try {
      const content = await ipcRenderer.invoke('read-file', configPath);
      const lines = content.split('\n');
      let updated = false;
      const restored = lines.map((line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes(':')) return line;
        const [key] = trimmed.split(':');
        if (key.trim() === 'theme') {
          updated = true;
          const indent = line.match(/^(\s*)/)?.[1] || '';
          return `${indent}theme: ${prevRaw}`;
        }
        return line;
      });
      if (!updated) restored.push(`theme: ${prevRaw}`);
      await ipcRenderer.invoke('write-file', configPath, restored.join('\n'));
      // 重新生成，恢复原主题的正常站点
      await runHexoCommand(ipcRenderer, 'clean');
      await runHexoCommand(ipcRenderer, 'generate');
    } catch (error) {
      console.error('回滚主题失败:', error);
    }
  };

  const switchTheme = async (entry: ThemeEntry) => {
    if (!isDesktopApp() || !hexoPath || switchingTheme) return;
    if (!entry.isValidHexo) {
      setMessage({
        success: false,
        text: zh
          ? `「${entry.name}」${entry.frameworkHint || '不是有效的 Hexo 主题'}，已禁止切换，避免生成白屏。请安装真正的 Hexo 主题（含 layout/ 模板目录）。`
          : `"${entry.name}" is ${entry.frameworkHint || 'not a valid Hexo theme'}. Switch blocked to avoid a blank page.`,
      });
      return;
    }
    const configName = entry.configName;
    if (isThemeActive(entry, currentTheme)) return;

    setSwitchingTheme(configName);
    setMessage(null);
    const ipcRenderer = await getIpcRenderer();
    const configPath = `${hexoPath}/_config.yml`;
    let prevRaw = '';

    try {
      // 1. 读取原主题配置（用于回滚）
      const content = await ipcRenderer.invoke('read-file', configPath);
      const prevMatch = content.match(/^theme:\s*["']?([^"'#\s]+)/m);
      prevRaw = prevMatch ? prevMatch[1].trim() : '';

      // 2. 写入新主题
      const lines = content.split('\n');
      let fieldUpdated = false;
      const updatedLines = lines.map((line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes(':')) return line;
        const [key] = trimmed.split(':');
        if (key.trim() === 'theme') {
          fieldUpdated = true;
          const indent = line.match(/^(\s*)/)?.[1] || '';
          return `${indent}theme: ${configName}`;
        }
        return line;
      });
      if (!fieldUpdated) updatedLines.push(`theme: ${configName}`);
      const newContent = updatedLines.join('\n');
      await ipcRenderer.invoke('write-file', configPath, newContent);

      // 3. 自动验证：clean + generate
      setMessage({
        success: false,
        text: zh ? `正在验证主题「${entry.name}」（清理并重新生成）...` : `Validating theme "${entry.name}" (clean + generate)...`,
      });
      await runHexoCommand(ipcRenderer, 'clean');
      const genResult = await runHexoCommand(ipcRenderer, 'generate');
      const genOutput = `${genResult?.stdout || ''}\n${genResult?.stderr || ''}`;

      // 4. 判定是否生成失败（No layout / 0 文件 / 命令失败）
      const hasNoLayout = /No layout/i.test(genOutput);
      const zeroFiles = /0 files generated/i.test(genOutput);
      const genFailed = !genResult?.success || hasNoLayout || zeroFiles;

      if (genFailed) {
        // 5. 自动回滚原主题并恢复站点
        await rollbackTheme(ipcRenderer, configPath, prevRaw);
        await loadThemes();
        setCurrentTheme(prevRaw);
        setMessage({
          success: false,
          text: zh
            ? `主题「${entry.name}」验证失败（${hasNoLayout ? '缺少 layout 模板，不是有效的 Hexo 主题' : '生成结果为 0 个文件'}），已自动回滚到原主题「${prevRaw}」并重新生成，站点未受影响。`
            : `Theme "${entry.name}" failed validation (${hasNoLayout ? 'no layout templates, not a valid Hexo theme' : '0 files generated'}). Rolled back to "${prevRaw}" and regenerated; your site is unaffected.`,
        });
        return;
      }

      // 6. 验证通过
      setCurrentTheme(configName);
      setMessage({
        success: true,
        text: zh
          ? `博客主题已切换为「${entry.name}」，已验证生成成功（不再白屏）。如需发布请执行「部署」。`
          : `Blog theme switched to "${entry.name}" and verified. Deploy to publish.`,
      });
    } catch (error) {
      console.error('切换博客主题失败:', error);
      // 异常时也尝试回滚
      if (prevRaw) {
        await rollbackTheme(ipcRenderer, configPath, prevRaw);
        await loadThemes();
        setCurrentTheme(prevRaw);
      }
      setMessage({
        success: false,
        text: (zh ? '切换博客主题失败，已自动回滚: ' : 'Failed to switch theme, rolled back: ') + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setSwitchingTheme(null);
    }
  };

  // 拉取远程主题目录（hexo.io/themes 全部主题）
  const loadCatalog = async (force = false) => {
    setIsLoadingCatalog(true);
    setCatalogProgress({ done: 0, total: 0 });
    setMessage(null);
    try {
      const items = await fetchHexoThemeCatalog(force, (done, total) => setCatalogProgress({ done, total }));
      setCatalog(items);
      setCatalogProgress(null);
    } catch (error) {
      console.error('拉取主题目录失败:', error);
      setMessage({
        success: false,
        text: (zh ? '拉取 hexo.io 主题目录失败: ' : 'Failed to fetch hexo.io theme catalog: ') + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setIsLoadingCatalog(false);
      setCatalogProgress(null);
    }
  };

  // 判断远程主题是否已安装（匹配已安装主题名/前缀）
  const isThemeInstalled = (remoteName: string): boolean => {
    const normalized = stripHexoThemePrefix(remoteName).toLowerCase();
    return themes.some((t) => stripHexoThemePrefix(t.name).toLowerCase() === normalized);
  };

  // 下载并安装远程主题：SSH git clone 到 themes/<name>，校验 layout 目录
  const installTheme = async (info: HexoThemeInfo) => {
    if (!isDesktopApp() || !hexoPath || installingTheme) return;
    if (isThemeInstalled(info.name)) {
      setMessage({ success: false, text: zh ? `「${info.name}」已安装` : `"${info.name}" is already installed` });
      return;
    }

    const sshUrl = toSshUrl(info.link);
    const targetDir = `${hexoPath}/themes/${info.name}`;
    setInstallingTheme(info.name);
    setInstallLog('');

    const appendLog = (line: string) => setInstallLog((prev) => (prev ? `${prev}\n${line}` : line));

    try {
      appendLog(zh ? `开始安装主题「${info.name}」...` : `Installing theme "${info.name}"...`);
      appendLog(`git clone ${sshUrl}`);
      const ipcRenderer = await getIpcRenderer();
      const result = await ipcRenderer.invoke('execute-command', `git clone --depth 1 ${sshUrl} ${targetDir}`);
      if (!result.success) {
        const err = result.stderr || result.error || result.stdout || '未知错误';
        appendLog(err);
        setMessage({
          success: false,
          text: zh
            ? `主题「${info.name}」下载失败。请确认已配置 GitHub SSH 密钥（~/.ssh/id_rsa），或稍后重试。\n${err}`
            : `Failed to download theme "${info.name}". Ensure your GitHub SSH key is configured, then retry.\n${err}`,
        });
        return;
      }
      appendLog(zh ? '下载完成，正在校验主题结构...' : 'Downloaded. Validating theme structure...');

      // 校验是否是有效 Hexo 主题（layout 目录）
      const files = await ipcRenderer
        .invoke('list-files', targetDir)
        .then((fs: any[]) => fs.map((f: any) => f.name.toLowerCase()))
        .catch(() => [] as string[]);
      const hasLayout = files.includes('layout');
      if (!hasLayout) {
        appendLog(zh ? '警告：该主题缺少 layout/ 目录，可能不是 Hexo 主题' : 'Warning: no layout/ directory - may not be a Hexo theme');
      }

      // 若主题自带 _config.yml，则生成根目录 _config.<name>.yml 的空配置占位（可选）
      const hasOwnConfig = files.includes('_config.yml');
      if (hasOwnConfig) {
        appendLog(zh ? '主题已自带 _config.yml（作为主题默认配置）' : 'Theme has its own _config.yml (default config)');
      }

      await loadThemes();
      appendLog(zh ? '安装完成！可点击主题卡片一键切换。' : 'Install complete! Click the theme card to switch.');
      setMessage({
        success: true,
        text: zh
          ? `主题「${info.name}」已安装到 themes/，现在可以一键切换（切换后需「清理 + 生成」）`
          : `Theme "${info.name}" installed to themes/. You can now switch to it (run Clean + Generate afterwards).`,
      });
    } catch (error) {
      console.error('安装主题失败:', error);
      appendLog(String(error));
      setMessage({
        success: false,
        text: (zh ? '安装主题失败: ' : 'Failed to install theme: ') + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setInstallingTheme(null);
    }
  };

  useEffect(() => {
    if (hexoPath) {
      loadThemes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexoPath]);

  // 进入"在线主题库"标签且目录为空时，自动加载（优先缓存/静态 JSON，秒开）
  useEffect(() => {
    if (activeTab === 'online' && catalog.length === 0) {
      loadCatalog(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, catalog.length]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center">
              <Palette className="w-5 h-5 mr-2 text-blue-600" />
              {zh ? '博客主题管理' : 'Blog Theme Manager'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={currentTheme ? 'default' : 'outline'} className="gap-1">
                <Sparkles className="w-3 h-3" />
                {zh ? '当前主题' : 'Current'}: {currentTheme || (zh ? '未设置' : 'Not set')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadThemes();
                  loadCatalog(true);
                }}
                disabled={isLoadingThemes || isReadingConfig || isLoadingCatalog}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingThemes || isLoadingCatalog ? 'animate-spin' : ''}`} />
                {zh ? '刷新' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`whitespace-pre-wrap rounded-lg border p-3 text-sm ${message.success ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
              {message.text}
            </div>
          )}

          {installLog && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 font-mono text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              <div className="mb-1 flex items-center gap-1 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                {zh ? '安装日志' : 'Install log'}
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">{installLog}</pre>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="installed">
                <FolderGit2 className="w-3.5 h-3.5 mr-1.5" />
                {zh ? '已安装' : 'Installed'} ({themes.length})
              </TabsTrigger>
              <TabsTrigger value="online">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                {zh ? '在线主题库' : 'Online'} ({catalog.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="installed" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                {zh
                  ? '自动扫描 themes/ 目录与 node_modules 中已安装的主题（hexo-theme-*），点击卡片一键切换。非 Hexo 主题（Gatsby/Hugo 等）已自动识别并禁用。'
                  : 'Automatically scans themes under themes/ and node_modules (hexo-theme-*). Non-Hexo themes are detected and disabled.'}
              </p>
              {isLoadingThemes ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <RefreshCw className="mb-3 h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm">{zh ? '正在扫描已安装主题...' : 'Scanning installed themes...'}</p>
                </div>
              ) : themes.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {themes.map((theme) => {
                    const isActive = isThemeActive(theme, currentTheme);
                    const isSwitching = switchingTheme === theme.configName;
                    const disabled = !theme.isValidHexo;
                    return (
                      <button
                        key={`${theme.source}-${theme.configName}`}
                        type="button"
                        onClick={() => switchTheme(theme)}
                        disabled={disabled || isSwitching || isActive}
                        title={disabled ? theme.frameworkHint || (zh ? '非有效 Hexo 主题' : 'Not a valid Hexo theme') : isActive ? (zh ? '当前使用中的主题' : 'Current theme') : (zh ? `一键切换到 ${theme.name}` : `Switch to ${theme.name}`)}
                        className={`group rounded-xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                          disabled
                            ? 'cursor-not-allowed border-red-200 bg-red-50/50 opacity-80 dark:border-red-900/60 dark:bg-red-950/20'
                            : isActive
                              ? 'border-green-400 bg-green-50 ring-2 ring-green-400/30 dark:bg-green-950/30'
                              : 'border-border bg-background hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                              disabled
                                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300'
                                : isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300'
                            }`}>
                              {isActive ? <Check className="h-4 w-4" /> : disabled ? <TriangleAlert className="h-4 w-4" /> : theme.source === 'themes' ? <FolderGit2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{theme.name}</div>
                              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {disabled ? (theme.frameworkHint || (zh ? '不可用' : 'Unavailable')) : (theme.version ? `v${theme.version}` : (theme.source === 'themes' ? 'themes/' : 'node_modules'))}
                              </div>
                            </div>
                          </div>
                          {isSwitching && <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-1">
                          <span className={`flex items-center gap-1 text-xs ${
                            disabled ? 'text-red-600 dark:text-red-300' : isActive ? 'text-green-700 dark:text-green-300' : 'text-blue-600 dark:text-blue-300'
                          }`}>
                            {isActive ? (<><Check className="h-3 w-3" />{zh ? '正在使用' : 'Active'}</>) : disabled ? (<><TriangleAlert className="h-3 w-3" />{zh ? '非 Hexo 主题' : 'Not Hexo'}</>) : (<><Rocket className="h-3 w-3" />{zh ? '点击一键切换' : 'Click to switch'}</>)}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {theme.source === 'themes' ? 'themes/' : 'npm'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <FolderGit2 className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium">{zh ? '未发现已安装的主题' : 'No installed themes found'}</p>
                  <p className="mt-1 text-xs">{zh ? '切换到「在线主题库」标签，搜索并一键下载安装。' : 'Switch to the "Online" tab to browse and install themes.'}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="online" className="space-y-3 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {zh
                    ? `共 ${catalog.length} 个主题，来源于 hexo.io/themes 官方目录。未安装的主题可通过 GitHub SSH 一键下载。`
                    : `${catalog.length} themes from hexo.io/themes. Uninstalled themes can be downloaded via GitHub SSH.`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCatalog(true)}
                  disabled={isLoadingCatalog}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
                  {zh ? '拉取目录' : 'Fetch'}
                </Button>
              </div>

              {isLoadingCatalog ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm">
                    {zh ? '正在从 hexo.io 拉取主题目录...' : 'Fetching theme catalog from hexo.io...'}
                    {catalogProgress && catalogProgress.total > 0 ? ` (${catalogProgress.done}/${catalogProgress.total})` : ''}
                  </p>
                </div>
              ) : catalog.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <Globe className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium">{zh ? '在线主题库为空' : 'Online catalog is empty'}</p>
                  <p className="mt-1 text-xs">{zh ? '点击「拉取目录」从 hexo.io 获取全部主题。' : 'Click "Fetch" to load all themes from hexo.io.'}</p>
                </div>
              ) : (
                <div className="flex min-h-0 flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={zh ? '搜索主题名称...' : 'Search theme name...'}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                    {catalog
                      .filter((t) => !catalogSearch || t.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map((info) => {
                        const installed = isThemeInstalled(info.name);
                        const installing = installingTheme === info.name;
                        return (
                          <div
                            key={info.name}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors ${
                              installed ? 'border-green-200 bg-green-50/50 dark:border-green-900/60 dark:bg-green-950/20' : 'border-border bg-background'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{info.name}</span>
                                {installed && (
                                  <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-300">
                                    <Check className="h-3 w-3 mr-0.5" />{zh ? '已安装' : 'Installed'}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{info.description}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <a
                                  href={info.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline dark:text-blue-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  GitHub
                                </a>
                                {info.preview && (
                                  <a
                                    href={info.preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:underline dark:text-blue-300"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {zh ? '预览' : 'Preview'}
                                  </a>
                                )}
                                {info.tags && info.tags.length > 0 && (
                                  <span className="truncate text-[10px] text-muted-foreground">
                                    {info.tags.slice(0, 4).join(' · ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={installed ? 'outline' : 'default'}
                              size="sm"
                              disabled={installed || installing || isLoadingThemes}
                              onClick={() => installTheme(info)}
                            >
                              {installing ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : installed ? (
                                <Check className="w-4 h-4 mr-1" />
                              ) : (
                                <Download className="w-4 h-4 mr-1" />
                              )}
                              {installed ? (zh ? '已安装' : 'Installed') : installing ? (zh ? '下载中...' : 'Downloading...') : (zh ? '安装' : 'Install')}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
