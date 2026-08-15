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
import { escapeShellArg, normalizePathInternal } from '@/lib/utils';

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
  // 主题 peerDependencies 中声明的 hexo 渲染器（如 hexo-renderer-pug / hexo-renderer-sass）
  requiredRenderers: string[];
  // 主题 scripts 目录 require 的第三方运行时依赖（如 js-yaml），缺失会导致 helper 未注册而白屏
  requiredScriptDeps: string[];
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
  ): Promise<{ hasPackageJson: boolean; packageName?: string; version?: string; peerDependencies?: Record<string, string> }> => {
    try {
      const pkgContent = await ipcRenderer.invoke('read-file', pkgPath);
      try {
        const pkg = JSON.parse(pkgContent);
        return {
          hasPackageJson: true,
          packageName: pkg.name || fallbackName,
          version: pkg.version,
          peerDependencies: pkg.peerDependencies,
        };
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
    // 主题声明但项目可能未安装的渲染器依赖（缺失会导致模板源码直接输出，即"白屏"）
    const requiredRenderers = Object.keys(info.peerDependencies || {}).filter((k) => k.startsWith('hexo-renderer-'));

    // 扫描主题 scripts 目录，收集 require 的第三方运行时依赖（排除相对路径、Node 内置模块、hexo 自身）
    const requiredScriptDeps: string[] = [];
    const builtinModules = new Set([
      'fs', 'path', 'url', 'util', 'os', 'crypto', 'stream', 'events', 'child_process',
      'http', 'https', 'querystring', 'zlib', 'buffer', 'process', 'module', 'net', 'tls',
    ]);
    try {
      const scriptsDir = `${dirPath}/scripts`;
      const collectRequires = async (dir: string) => {
        let files: any[] = [];
        try {
          files = await ipcRenderer.invoke('list-files', dir);
        } catch {
          return;
        }
        for (const f of files) {
          if (f.isDirectory) {
            await collectRequires(f.path);
          } else if (f.name.endsWith('.js')) {
            try {
              const js = await ipcRenderer.invoke('read-file', f.path);
              const re = /require\(\s*["']([^"']+)["']\s*\)/g;
              let m: RegExpExecArray | null;
              while ((m = re.exec(js)) !== null) {
                const spec = m[1];
                if (!spec || spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('#')) continue;
                // 作用域包取前两段，普通包取第一段
                const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
                if (!builtinModules.has(pkg) && pkg !== 'hexo' && !pkg.startsWith('hexo-')) {
                  if (!requiredScriptDeps.includes(pkg)) requiredScriptDeps.push(pkg);
                }
              }
            } catch {
              // 忽略单个脚本读取失败
            }
          }
        }
      };
      await collectRequires(scriptsDir);
    } catch {
      // 忽略 scripts 目录扫描失败
    }

    return {
      name,
      configName: name,
      source,
      isValidHexo,
      frameworkHint: frameworkHint || (isValidHexo ? undefined : '不是有效的 Hexo 主题'),
      hasPackageJson: info.hasPackageJson,
      packageName: info.packageName,
      version: info.version,
      requiredRenderers,
      requiredScriptDeps,
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

  // 检查项目 node_modules 中是否已安装某个 hexo 渲染器
  const hasRenderer = async (ipcRenderer: any, renderer: string): Promise<boolean> => {
    try {
      const files = await ipcRenderer.invoke('list-files', `${hexoPath}/node_modules/${renderer}`);
      return Array.isArray(files) && files.length > 0;
    } catch {
      return false;
    }
  };

  // 自动安装主题缺失的渲染器与脚本运行时依赖（如 hexo-renderer-pug / hexo-renderer-sass / js-yaml）
  // 缺失渲染器会导致 Hexo 把模板源码直接输出（即"白屏"）；缺失脚本依赖会导致主题 helper 未注册而白屏
  const ensureThemeRenderers = async (ipcRenderer: any, entry: ThemeEntry, onProgress: (msg: string) => void) => {
    const missing = new Set<string>();
    for (const renderer of entry.requiredRenderers) {
      if (!(await hasRenderer(ipcRenderer, renderer))) {
        missing.add(renderer);
      }
    }
    for (const dep of entry.requiredScriptDeps) {
      if (!(await hasRenderer(ipcRenderer, dep))) {
        missing.add(dep);
      }
    }
    if (missing.size === 0) return;

    // 与创建项目/安装部署插件保持一致的 npm 用法：--prefix 指定工作目录，避免 cd && 的跨平台问题
    for (const pkgName of missing) {
      onProgress(zh ? `检测到主题需要依赖 ${pkgName}，正在自动安装...` : `Installing required dependency ${pkgName}...`);
      const installResult = await ipcRenderer.invoke('execute-command', `npm install ${pkgName} --save --prefix ${hexoPath}`);
      if (!installResult.success) {
        // 失败后清理缓存重试一次
        await ipcRenderer.invoke('execute-command', 'npm cache clean --force');
        const retryResult = await ipcRenderer.invoke('execute-command', `npm install ${pkgName} --save --prefix ${hexoPath}`);
        if (!retryResult.success) {
          throw new Error(
            `安装依赖 ${pkgName} 失败: ${retryResult.stderr || retryResult.error || retryResult.stdout || '未知错误'}`
          );
        }
      }
    }
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
    const validatingCurrentTheme = isThemeActive(entry, currentTheme);

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

      // 2. 切换其他主题时写入配置；当前主题则直接进入依赖修复和验证流程
      if (!validatingCurrentTheme) {
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
        await ipcRenderer.invoke('write-file', configPath, updatedLines.join('\n'));
      }

      // 3. 自动安装主题声明的缺失渲染器（Pug/Sass 等），避免模板源码直接输出造成白屏
      await ensureThemeRenderers(ipcRenderer, entry, (msg) =>
        setMessage({ success: false, text: msg })
      );

      // 4. 自动验证：clean + generate
      setMessage({
        success: false,
        text: zh ? `正在验证主题「${entry.name}」（清理并重新生成）...` : `Validating theme "${entry.name}" (clean + generate)...`,
      });
      await runHexoCommand(ipcRenderer, 'clean');
      const genResult = await runHexoCommand(ipcRenderer, 'generate');
      const genOutput = `${genResult?.stdout || ''}\n${genResult?.stderr || ''}`;

      // 5. 判定是否生成失败：
      // - No layout / 0 files generated：不是有效 Hexo 主题
      // - 命令失败
      const hasNoLayout = /No layout/i.test(genOutput);
      const zeroFiles = /0 files generated/i.test(genOutput);
      const genFailed = !genResult?.success || hasNoLayout || zeroFiles;

      if (genFailed) {
        // 6. 自动回滚原主题并恢复站点
        await rollbackTheme(ipcRenderer, configPath, prevRaw);
        await loadThemes();
        setCurrentTheme(prevRaw);
        setMessage({
          success: false,
          text: zh
            ? `主题「${entry.name}」验证失败（${hasNoLayout ? '缺少 layout 模板，不是有效的 Hexo 主题' : zeroFiles ? '生成结果为 0 个文件' : '生成命令执行失败'}），已自动回滚到原主题「${prevRaw}」并重新生成，站点未受影响。`
            : `Theme "${entry.name}" failed validation (${hasNoLayout ? 'no layout templates, not a valid Hexo theme' : zeroFiles ? '0 files generated' : 'generate command failed'}). Rolled back to "${prevRaw}" and regenerated; your site is unaffected.`,
        });
        return;
      }

      // 6. 验证通过
      setCurrentTheme(configName);
      setMessage({
        success: true,
        text: zh
          ? (validatingCurrentTheme
              ? `主题「${entry.name}」依赖已检查并重新生成成功。`
              : `博客主题已切换为「${entry.name}」，依赖已安装并验证生成成功。如需发布请执行「部署」。`)
          : (validatingCurrentTheme
              ? `Theme "${entry.name}" dependencies were checked and regeneration succeeded.`
              : `Blog theme switched to "${entry.name}", dependencies installed, and generation verified. Deploy to publish.`),
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

  // 下载并安装远程主题：HTTPS 优先、SSH 兜底、强校验、依赖安装、移除嵌套 Git 元数据
  const installTheme = async (info: HexoThemeInfo) => {
    if (!isDesktopApp() || !hexoPath || installingTheme) return;
    if (isThemeInstalled(info.name)) {
      setMessage({ success: false, text: zh ? `「${info.name}」已安装` : `"${info.name}" is already installed` });
      return;
    }

    const ipcRenderer = await getIpcRenderer();
    const targetDir = normalizePathInternal(`${hexoPath}/themes/${info.name}`);
    const escapedTargetDir = escapeShellArg(targetDir);
    const httpsUrl = info.link.endsWith('.git') ? info.link : `${info.link.replace(/\/$/, '')}.git`;
    const sshUrl = toSshUrl(info.link);
    setInstallingTheme(info.name);
    setInstallLog('');

    const appendLog = (line: string) => setInstallLog((prev) => (prev ? `${prev}\n${line}` : line));
    const cleanupTarget = async () => {
      await ipcRenderer.invoke('remove-directory', targetDir).catch(() => undefined);
    };

    try {
      appendLog(zh ? `开始安装主题「${info.name}」...` : `Installing theme "${info.name}"...`);
      await cleanupTarget();

      // HTTPS 无需用户配置 SSH 密钥，优先使用；失败后再尝试 SSH。
      appendLog(`git clone --depth 1 ${httpsUrl}`);
      let result = await ipcRenderer.invoke(
        'execute-command',
        `git clone --depth 1 ${escapeShellArg(httpsUrl)} ${escapedTargetDir}`
      );
      if (!result.success) {
        appendLog(zh ? 'HTTPS 下载失败，正在尝试 SSH...' : 'HTTPS clone failed; trying SSH...');
        appendLog(result.stderr || result.error || result.stdout || '');
        await cleanupTarget();
        result = await ipcRenderer.invoke(
          'execute-command',
          `git clone --depth 1 ${escapeShellArg(sshUrl)} ${escapedTargetDir}`
        );
      }
      if (!result.success) {
        const err = result.stderr || result.error || result.stdout || '未知错误';
        await cleanupTarget();
        throw new Error(zh
          ? `HTTPS 与 SSH 下载均失败：${err}`
          : `Both HTTPS and SSH clone failed: ${err}`);
      }

      appendLog(zh ? '下载完成，正在校验主题结构...' : 'Downloaded. Validating theme structure...');
      const files = await ipcRenderer
        .invoke('list-files', targetDir)
        .then((items: any[]) => items.map((item: any) => item.name.toLowerCase()))
        .catch(() => [] as string[]);

      if (!files.includes('layout')) {
        await cleanupTarget();
        throw new Error(zh
          ? '下载内容缺少 layout/ 目录，不是有效的 Hexo 主题，已自动清理'
          : 'Downloaded repository has no layout/ directory and is not a valid Hexo theme; cleaned up');
      }

      // 扫描 package.json peerDependencies 与 scripts require，自动安装渲染器和运行时依赖。
      const installedEntry = await inspectTheme(ipcRenderer, targetDir, info.name, 'themes');
      await ensureThemeRenderers(ipcRenderer, installedEntry, appendLog);

      // clone 目录内的 .git 会被主仓库视为嵌套仓库，造成 git submodule status / git add 异常。
      await ipcRenderer.invoke('remove-directory', `${targetDir}/.git`).catch(() => undefined);
      appendLog(zh ? '已移除主题内部 Git 元数据，主题将作为普通文件随博客推送' : 'Removed nested Git metadata; theme will be committed as normal blog files');

      await loadThemes();
      appendLog(zh ? '安装与依赖配置完成，可安全切换主题。' : 'Theme and dependencies installed; it is ready to switch safely.');
      setMessage({
        success: true,
        text: zh
          ? `主题「${info.name}」安装完成，所需渲染器已检查，且不会产生 Git 子模块错误。`
          : `Theme "${info.name}" installed with required renderers and without nested Git/submodule issues.`,
      });
    } catch (error) {
      await cleanupTarget();
      console.error('安装主题失败:', error);
      appendLog(String(error));
      setMessage({
        success: false,
        text: (zh ? '安装主题失败，已清理不完整目录: ' : 'Theme installation failed; incomplete directory cleaned: ') + (error instanceof Error ? error.message : String(error)),
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
                        disabled={disabled || isSwitching}
                        title={disabled
                          ? theme.frameworkHint || (zh ? '非有效 Hexo 主题' : 'Not a valid Hexo theme')
                          : isActive
                            ? (zh ? '点击检查依赖并重新生成当前主题' : 'Check dependencies and regenerate current theme')
                            : (zh ? `一键切换到 ${theme.name}` : `Switch to ${theme.name}`)}
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
