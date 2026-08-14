'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Save, RotateCcw, Download, Upload, Palette, Check, RefreshCw } from 'lucide-react';
import { Language, getTexts } from '@/utils/i18n';
import { isDesktopApp, getIpcRenderer } from '@/lib/desktop-api';

interface HexoConfigProps {
  hexoPath: string;
  onConfigUpdate?: () => void;
}

interface ConfigData {
  title?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  language?: string;
  timezone?: string;
  url?: string;
  root?: string;
  permalink?: string;
  theme?: string;
  deploy?: any;
}

export function HexoConfig({ hexoPath, onConfigUpdate }: HexoConfigProps) {
  const [configData, setConfigData] = useState<ConfigData>({});
  const [rawConfig, setRawConfig] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  // 博客主题切换
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState<boolean>(false);
  const [switchingTheme, setSwitchingTheme] = useState<string | null>(null);
  
  // 获取当前语言的文本
  const t = getTexts(language);

  
  // 组件加载时，尝试从localStorage加载语言设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // 扫描 themes 目录，获取已安装的博客主题列表
  const loadBlogThemes = async () => {
    if (!isDesktopApp() || !hexoPath) return;

    setIsLoadingThemes(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      const themesPath = `${hexoPath}/themes`;
      const files = await ipcRenderer.invoke('list-files', themesPath);
      const themes = files
        .filter((file: any) => file.isDirectory && !file.name.startsWith('.'))
        .map((file: any) => file.name)
        .sort((a: string, b: string) => a.localeCompare(b));
      setAvailableThemes(themes);
    } catch (error) {
      console.warn('扫描博客主题目录失败（可能尚未创建 themes 目录）:', error);
      setAvailableThemes([]);
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // 一键切换博客主题：修改 _config.yml 中的 theme 字段并保存
  const switchBlogTheme = async (themeName: string) => {
    if (!isDesktopApp() || !hexoPath || switchingTheme) return;
    if (themeName === configData.theme) return;

    setSwitchingTheme(themeName);
    try {
      updateConfigField('theme', themeName);

      const ipcRenderer = await getIpcRenderer();
      const configPath = `${hexoPath}/_config.yml`;
      // 等待状态更新后写入（直接基于当前 rawConfig 写入）
      const updatedLines = rawConfig.split('\n');
      let fieldUpdated = false;
      const lines = updatedLines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes(':')) return line;
        const [key] = trimmed.split(':');
        if (key.trim() === 'theme') {
          fieldUpdated = true;
          const indent = line.match(/^(\s*)/)?.[1] || '';
          return `${indent}theme: ${themeName}`;
        }
        return line;
      });
      if (!fieldUpdated) {
        lines.push(`theme: ${themeName}`);
      }
      const newConfig = lines.join('\n');
      await ipcRenderer.invoke('write-file', configPath, newConfig);

      setRawConfig(newConfig);
      setConfigData(prev => ({ ...prev, theme: themeName }));

      setSaveResult({
        success: true,
        message: language === 'zh'
          ? `博客主题已切换为「${themeName}」，重新生成后生效`
          : `Blog theme switched to "${themeName}", rebuild to apply`
      });

      if (onConfigUpdate) {
        onConfigUpdate();
      }
    } catch (error) {
      console.error('切换博客主题失败:', error);
      setSaveResult({
        success: false,
        message: (language === 'zh' ? '切换博客主题失败: ' : 'Failed to switch theme: ') + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setSwitchingTheme(null);
    }
  };

  // 加载配置文件
  const loadConfig = async () => {
    if (!isDesktopApp() || !hexoPath) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      const configPath = `${hexoPath}/_config.yml`;
      const content = await ipcRenderer.invoke('read-file', configPath);

      setRawConfig(content);
      parseConfig(content);
      loadBlogThemes();
    } catch (error) {
      console.error('加载配置失败:', error);
      setSaveResult({
        success: false,
        message: '加载配置失败: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 解析YAML配置
  const parseConfig = (content: string) => {
    const config: ConfigData = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes(':')) continue;

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      // 移除引号
      const cleanValue = value.replace(/^["']|["']$/g, '');
      const keyTrimmed = key.trim();

      // 处理所有匹配的字段，包括空值
      switch (keyTrimmed) {
        case 'title':
          config.title = cleanValue;
          break;
        case 'subtitle':
          config.subtitle = cleanValue;
          break;
        case 'description':
          config.description = cleanValue;
          break;
        case 'author':
          config.author = cleanValue;
          break;
        case 'language':
          config.language = cleanValue;
          break;
        case 'timezone':
          config.timezone = cleanValue;
          break;
        case 'url':
          config.url = cleanValue;
          break;
        case 'root':
          config.root = cleanValue;
          break;
        case 'permalink':
          config.permalink = cleanValue;
          break;
        case 'theme':
          config.theme = cleanValue;
          break;
      }
    }

    setConfigData(config);
  };

  // 保存配置
  const saveConfig = async () => {
    if (!isDesktopApp() || !hexoPath) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      const configPath = `${hexoPath}/_config.yml`;
      await ipcRenderer.invoke('write-file', configPath, rawConfig);

      setSaveResult({
        success: true,
        message: t.configSaveSuccess
      });

      if (onConfigUpdate) {
        onConfigUpdate();
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaveResult({
        success: false,
        message: '保存配置失败: ' + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 重置配置
  const resetConfig = () => {
    loadConfig();
    setSaveResult(null);
  };

  // 导出配置
  const exportConfig = () => {
    if (!rawConfig) return;

    const blob = new Blob([rawConfig], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '_config.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yml,.yaml';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const content = await file.text();
        setRawConfig(content);
        parseConfig(content);
        setSaveResult({
          success: true,
          message: t.configImportSuccess
        });
      }
    };

    input.click();
  };

  // 更新配置字段 - 修复版本，避免重复键
  const updateConfigField = (field: keyof ConfigData, value: string) => {
    setConfigData(prev => ({
      ...prev,
      [field]: value
    }));

    // 同时更新原始配置
    const lines = rawConfig.split('\n');
    let fieldUpdated = false;

    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes(':')) return line;

      const [key, ...valueParts] = trimmed.split(':');
      const keyTrimmed = key.trim();

      if (keyTrimmed === field) {
        fieldUpdated = true;
        // 保持原有的缩进格式
        const indent = line.match(/^(\s*)/)?.[1] || '';
        return `${indent}${keyTrimmed}: ${value}`;
      }
      return line;
    });

    // 只有当字段真的不存在时才添加新字段
    if (!fieldUpdated) {
      // 检查是否是基本配置字段
      const basicFields = ['title', 'subtitle', 'description', 'author', 'language', 'timezone', 'url', 'root', 'permalink', 'theme'];
      if (basicFields.includes(field)) {
        // 在文件开头的适当位置插入新字段
        let insertIndex = 0;
        for (let i = 0; i < updatedLines.length; i++) {
          const trimmed = updatedLines[i].trim();
          if (!trimmed.startsWith('#') && trimmed.includes(':')) {
            const [existingKey] = trimmed.split(':');
            if (basicFields.includes(existingKey.trim())) {
              insertIndex = i + 1;
            } else {
              break;
            }
          }
        }
        updatedLines.splice(insertIndex, 0, `${field}: ${value}`);
      }
    }

    setRawConfig(updatedLines.join('\n'));
  };

  useEffect(() => {
    if (hexoPath) {
      loadConfig();
    }
  }, [hexoPath]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            {t.hexoConfig}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportConfig}
              disabled={!rawConfig}
            >
              <Download className="w-3 h-3 mr-1" />
              {t.exportConfig}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={importConfig}
            >
              <Upload className="w-3 h-3 mr-1" />
              {t.importConfig}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetConfig}
              disabled={isLoading}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t.resetConfig}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveConfig}
              disabled={isLoading}
            >
              <Save className="w-3 h-3 mr-1" />
              {t.saveConfig}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {saveResult && (
          <Alert className={`mb-4 ${saveResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className={saveResult.success ? 'text-green-700' : 'text-red-700'}>
              {saveResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">{t.basicSettings}</TabsTrigger>
            <TabsTrigger value="advanced">{t.advancedSettings}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t.websiteTitle}</Label>
                <Input
                  id="title"
                  value={configData.title || ''}
                  onChange={(e) => updateConfigField('title', e.target.value)}
                  placeholder="我的博客"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">{t.subtitle}</Label>
                <Input
                  id="subtitle"
                  value={configData.subtitle || ''}
                  onChange={(e) => updateConfigField('subtitle', e.target.value)}
                  placeholder="博客副标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">{t.author}</Label>
                <Input
                  id="author"
                  value={configData.author || ''}
                  onChange={(e) => updateConfigField('author', e.target.value)}
                  placeholder="作者名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t.language}</Label>
                <Input
                  id="language"
                  value={configData.language || ''}
                  onChange={(e) => updateConfigField('language', e.target.value)}
                  placeholder="zh-CN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">{t.timezone}</Label>
                <Input
                  id="timezone"
                  value={configData.timezone || ''}
                  onChange={(e) => updateConfigField('timezone', e.target.value)}
                  placeholder="Asia/Shanghai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">{t.theme}</Label>
                <Input
                  id="theme"
                  value={configData.theme || ''}
                  onChange={(e) => updateConfigField('theme', e.target.value)}
                  placeholder="landscape"
                />
              </div>
            </div>

          {/* 已安装博客主题一键切换 */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <Label className="text-base font-medium">
                  {language === 'zh' ? '博客主题一键切换' : 'One-Click Blog Theme Switch'}
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBlogThemes}
                disabled={isLoadingThemes}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingThemes ? 'animate-spin' : ''}`} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'zh'
                ? '自动扫描 themes 目录中的已安装主题，点击即可修改 _config.yml 的 theme 字段并保存（重新生成后生效）。'
                : 'Scans installed themes under themes/. Click to update the theme field in _config.yml and save (applies after rebuild).'}
            </p>

            {isLoadingThemes ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                {language === 'zh' ? '正在扫描已安装主题...' : 'Scanning installed themes...'}
              </div>
            ) : availableThemes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {availableThemes.map((themeName) => {
                  const isActive = themeName === configData.theme;
                  const isSwitching = switchingTheme === themeName;
                  return (
                    <button
                      key={themeName}
                      type="button"
                      onClick={() => switchBlogTheme(themeName)}
                      disabled={isSwitching || isActive}
                      className={`rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isActive
                          ? 'border-green-400 bg-green-50 ring-2 ring-green-400/30 dark:bg-green-950/30'
                          : 'border-border bg-background hover:border-blue-400'
                      }`}
                      title={isActive
                        ? (language === 'zh' ? '当前使用的主题' : 'Current theme')
                        : (language === 'zh' ? `一键切换到 ${themeName}` : `Switch to ${themeName}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{themeName}</span>
                        {isActive ? (
                          <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                        ) : isSwitching ? (
                          <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin text-blue-500" />
                        ) : null}
                      </div>
                      <div className={`mt-1 text-[11px] ${isActive ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                        {isActive
                          ? (language === 'zh' ? '使用中' : 'Active')
                          : (language === 'zh' ? '点击切换' : 'Click to switch')}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {language === 'zh'
                  ? 'themes 目录下未发现已安装主题，请先安装主题（例如 git clone 到 themes 目录）后点击刷新。'
                  : 'No installed themes found under themes/. Install a theme first, then click Refresh.'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.websiteDescription}</Label>
              <Textarea
                id="description"
                value={configData.description || ''}
                onChange={(e) => updateConfigField('description', e.target.value)}
                placeholder="网站描述信息"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">{t.websiteUrl}</Label>
                <Input
                  id="url"
                  value={configData.url || ''}
                  onChange={(e) => updateConfigField('url', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="root">{t.websiteRoot}</Label>
                <Input
                  id="root"
                  value={configData.root || ''}
                  onChange={(e) => updateConfigField('root', e.target.value)}
                  placeholder="/"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permalink">{t.permalinkFormat}</Label>
              <Input
                id="permalink"
                value={configData.permalink || ''}
                onChange={(e) => updateConfigField('permalink', e.target.value)}
                placeholder=":year/:month/:day/:title/"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw-config">{t.rawConfig}</Label>
              <Textarea
                id="raw-config"
                value={rawConfig}
                onChange={(e) => {
                  setRawConfig(e.target.value);
                  parseConfig(e.target.value);
                }}
                placeholder="YAML 配置内容"
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
