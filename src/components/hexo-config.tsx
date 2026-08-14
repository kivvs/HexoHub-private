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
import { Settings, Save, RotateCcw, Download, Upload } from 'lucide-react';
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
        message: '保存配置失败: ' + (error instanceof Error ? error.message : String(error))
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
