'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, RefreshCw, Check, FolderGit2, Package, Sparkles, Rocket } from 'lucide-react';
import { getIpcRenderer, isDesktopApp } from '@/lib/desktop-api';

interface BlogThemePanelProps {
  hexoPath: string;
  language?: 'zh' | 'en';
}

interface ThemeEntry {
  /** 展示名 */
  name: string;
  /** 写入 _config.yml 时使用的 theme 值 */
  configName: string;
  /** 主题源码来源 */
  source: 'themes' | 'node_modules';
  hasPackageJson: boolean;
  packageName?: string;
  version?: string;
}

export function BlogThemePanel({ hexoPath, language = 'zh' }: BlogThemePanelProps) {
  const [themes, setThemes] = useState<ThemeEntry[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [isLoadingThemes, setIsLoadingThemes] = useState<boolean>(false);
  const [isReadingConfig, setIsReadingConfig] = useState<boolean>(false);
  const [switchingTheme, setSwitchingTheme] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const zh = language === 'zh';

  // Hexo 主题加载顺序：themes/<name> 目录 → node_modules/hexo-theme-<name>。
  // 因此：
  //  - themes/ 目录下的主题，theme 字段必须写【目录原名】（如 hexo-theme-redefine，短名 redefine 查不到）
  //  - node_modules 中的 hexo-theme-* 主题，theme 字段必须写【短名】（如 fluid，Hexo 会自动拼接 hexo-theme- 前缀）
  const stripHexoThemePrefix = (name: string): string => name.replace(/^hexo-theme-/i, '');

  // 读取 _config.yml 中当前的 theme 字段（原始值）
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

  // 判断主题条目是否为当前正在使用的主题（兼容完整名/短名两种写法）
  const isThemeActive = (entry: ThemeEntry, rawCurrent: string): boolean => {
    if (!rawCurrent) return false;
    if (entry.configName === rawCurrent) return true;
    if (entry.name === rawCurrent) return true;
    // 兼容：hexo-theme-redefine 与 redefine 视为同一主题
    if (stripHexoThemePrefix(entry.configName) === stripHexoThemePrefix(rawCurrent)) return true;
    return false;
  };

  // 读取主题 package.json 信息
  const readPackageInfo = async (
    ipcRenderer: any,
    pkgPath: string,
    fallbackName: string
  ): Promise<{ hasPackageJson: boolean; packageName?: string; version?: string }> => {
    try {
      const pkgContent = await ipcRenderer.invoke('read-file', pkgPath);
      try {
        const pkg = JSON.parse(pkgContent);
        return {
          hasPackageJson: true,
          packageName: pkg.name || fallbackName,
          version: pkg.version,
        };
      } catch {
        return { hasPackageJson: true, packageName: fallbackName };
      }
    } catch {
      return { hasPackageJson: false, packageName: fallbackName };
    }
  };

  // 加载主题列表：扫描 themes/ 目录 + node_modules/hexo-theme-*
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

      // 1. 扫描 themes/ 目录：theme 字段使用目录原名
      try {
        const themesFiles = await ipcRenderer.invoke('list-files', themesPath);
        const themesDirs = themesFiles.filter((file: any) => file.isDirectory && !file.name.startsWith('.'));
        for (const dir of themesDirs) {
          const key = stripHexoThemePrefix(dir.name); // 去重键（redefine 与 hexo-theme-redefine 视为同一主题）
          if (themeMap.has(key)) continue;
          const info = await readPackageInfo(ipcRenderer, `${themesPath}/${dir.name}/package.json`, dir.name);
          themeMap.set(key, { name: dir.name, configName: dir.name, source: 'themes', ...info });
        }
      } catch {
        // themes 目录不存在或不可读，忽略
      }

      // 2. 扫描 node_modules/hexo-theme-*：theme 字段使用短名
      try {
        const nodeModulesFiles = await ipcRenderer.invoke('list-files', nodeModulesPath);
        const npmThemes = nodeModulesFiles.filter(
          (file: any) => file.isDirectory && /^hexo-theme-/.test(file.name)
        );
        for (const dir of npmThemes) {
          const shortName = stripHexoThemePrefix(dir.name);
          if (themeMap.has(shortName)) continue;
          const info = await readPackageInfo(ipcRenderer, `${nodeModulesPath}/${dir.name}/package.json`, shortName);
          themeMap.set(shortName, { name: shortName, configName: shortName, source: 'node_modules', ...info });
        }
      } catch {
        // node_modules 不存在，忽略
      }

      const themeEntries = Array.from(themeMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      setThemes(themeEntries);

      // 读取当前使用的主题（原始配置值）
      const current = await readCurrentTheme();
      setCurrentTheme(current);
    } catch (error) {
      console.warn('扫描博客主题失败:', error);
      setThemes([]);
      setMessage({ success: false, text: zh ? '扫描主题失败，请确认 themes 目录或 node_modules 存在' : 'Failed to scan themes' });
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // 一键切换博客主题：修改 _config.yml 的 theme 字段并保存
  const switchTheme = async (entry: ThemeEntry) => {
    if (!isDesktopApp() || !hexoPath || switchingTheme) return;

    const configName = entry.configName;
    if (isThemeActive(entry, currentTheme)) return;

    setSwitchingTheme(configName);
    setMessage(null);
    try {
      const ipcRenderer = await getIpcRenderer();
      const configPath = `${hexoPath}/_config.yml`;
      const content = await ipcRenderer.invoke('read-file', configPath);

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

      if (!fieldUpdated) {
        updatedLines.push(`theme: ${configName}`);
      }

      const newContent = updatedLines.join('\n');
      await ipcRenderer.invoke('write-file', configPath, newContent);

      setCurrentTheme(configName);
      setMessage({
        success: true,
        text: zh
          ? `博客主题已切换为「${entry.name}」，点击「生成」重新构建后即可看到新主题效果`
          : `Blog theme switched to "${entry.name}". Run "Generate" to apply.`,
      });
    } catch (error) {
      console.error('切换博客主题失败:', error);
      setMessage({
        success: false,
        text: (zh ? '切换博客主题失败: ' : 'Failed to switch theme: ') + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setSwitchingTheme(null);
    }
  };

  // 加载主题并同步当前主题
  useEffect(() => {
    if (hexoPath) {
      loadThemes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexoPath]);

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
                onClick={loadThemes}
                disabled={isLoadingThemes || isReadingConfig}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingThemes ? 'animate-spin' : ''}`} />
                {zh ? '刷新' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {zh
              ? '自动扫描 themes/ 目录与 node_modules 中已安装的主题（hexo-theme-*），点击卡片即可一键切换博客主题（修改 _config.yml 并保存）。切换后需「清理 + 生成」重新构建博客。'
              : 'Automatically scans themes installed under themes/ and node_modules (hexo-theme-*). Click a card to switch the blog theme (updates and saves _config.yml). Rebuild with Clean + Generate afterwards.'}
          </p>

          {message && (
            <div className={`rounded-lg border p-3 text-sm ${message.success ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
              {message.text}
            </div>
          )}

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
                return (
                  <button
                    key={`${theme.source}-${theme.configName}`}
                    type="button"
                    onClick={() => switchTheme(theme)}
                    disabled={isSwitching || isActive}
                    className={`group rounded-xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                      isActive
                        ? 'border-green-400 bg-green-50 ring-2 ring-green-400/30 dark:bg-green-950/30'
                        : 'border-border bg-background hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                    }`}
                    title={isActive ? (zh ? '当前使用中的主题' : 'Current theme') : (zh ? `一键切换到 ${theme.name}` : `Switch to ${theme.name}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                          {isActive ? <Check className="h-4 w-4" /> : theme.source === 'themes' ? <FolderGit2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{theme.name}</div>
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {theme.version ? `v${theme.version}` : (theme.source === 'themes' ? 'themes/' : 'node_modules')}
                          </div>
                        </div>
                      </div>
                      {isSwitching && <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-1">
                      <span className={`flex items-center gap-1 text-xs ${isActive ? 'text-green-700 dark:text-green-300' : 'text-blue-600 dark:text-blue-300'}`}>
                        {isActive ? (
                          <><Check className="h-3 w-3" />{zh ? '正在使用' : 'Active'}</>
                        ) : (
                          <><Rocket className="h-3 w-3" />{zh ? '点击一键切换' : 'Click to switch'}</>
                        )}
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
              <p className="mt-1 text-xs">
                {zh
                  ? '请将主题放入 themes/ 目录（例如 git clone ... themes/fluid），或通过 npm 安装（npm install hexo-theme-fluid），然后点击刷新。'
                  : 'Put a theme into themes/ (e.g. git clone ... themes/fluid) or install via npm (npm install hexo-theme-fluid), then click Refresh.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
