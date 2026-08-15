'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FolderOpen,
  FileText,
  Settings,
  Play,
  Save,
  Trash2,
  Plus,
  Eye,
  Edit,
  Globe,
  Terminal,
  Server,
  Square,
  Languages,
  Sun,
  Moon,
  Palette,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Grid3X3,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  ChevronUp,
  Download,
  Upload,
  Lightbulb,
  BarChart3,
  ExternalLink,
  Rocket,
  RefreshCw,
  Monitor,
  Sparkles,
  Undo2,
  Eraser,
  Stethoscope
} from 'lucide-react';
import { Language, getTexts } from '@/utils/i18n';
import { MarkdownEditorWrapper } from '@/components/markdown-editor-wrapper';
import { MarkdownPreview } from '@/components/markdown-preview';
import { PostList } from '@/components/post-list';
import { HexoConfig } from '@/components/hexo-config';
import { CreatePostDialog } from '@/components/create-post-dialog';
import { TagCloud } from '@/components/tag-cloud';
import { PublishStats } from '@/components/publish-stats';
import { PanelSettings } from '@/components/panel-settings';
import { BlogThemePanel } from '@/components/blog-theme-panel';
import { ExternalAnalyticsCards } from '@/components/external-analytics-cards';
import { GiscusCommentsAnalyticsPage, Ga4ViewsAnalyticsPage } from '@/components/external-analytics-pages';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ToastAction } from '@/components/ui/toast';
import { CreateHexoDialog } from '@/components/create-hexo-dialog';
import { CustomTitlebar } from '@/components/custom-titlebar';
import { AIInspirationDialog } from '@/components/ai-inspiration-dialog';
import { AIAnalysisDialog } from '@/components/ai-analysis-dialog';
import { AIDiagnosticDialog } from '@/components/ai-diagnostic-dialog';
import { getIpcRenderer, isDesktopApp, isTauri } from '@/lib/desktop-api';
import { commandOperations } from '@/lib/tauri-api';
import { normalizePath, normalizePathInternal, escapeShellArg } from '@/lib/utils';
import {
  AppThemeName,
  applyAppTheme,
  getAppThemeOption,
  getNextAppTheme,
  getStoredAppTheme,
  isAppThemeDark,
  setAppTheme,
} from '@/lib/theme';
import { findImageSources, inferImageExtension, replaceImageSources, cleanRichTextHtml } from '@/lib/extract-images';

interface Post {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: Date;
  frontmatterDate?: Date;
}

// 字体颜色选择器弹层（Portal 渲染，fixed 定位到锚点按钮下方）
function ColorPickerPopover({
  anchorEl,
  currentTextColor,
  onPick,
  onClear,
  language,
}: {
  anchorEl: HTMLElement;
  currentTextColor: string;
  onPick: (color: string) => void;
  onClear: () => void;
  language: 'zh' | 'en';
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = 176; // w-44
    const viewportWidth = window.innerWidth;
    // 避免右侧溢出视口
    let left = rect.right - popoverWidth;
    if (left < 8) left = 8;
    if (left + popoverWidth > viewportWidth - 8) left = viewportWidth - popoverWidth - 8;
    const top = rect.bottom + 4;
    setPosition({ top, left });
  }, [anchorEl]);

  const pickerColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#64748b', '#000000',
  ];

  if (!position) return null;

  return (
    <div
      className="fixed z-[9999] w-44 rounded-xl border border-border bg-popover p-2 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
        {language === 'zh' ? '文字颜色' : 'Text Color'}
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {pickerColors.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onPick(color)}
            className={`h-5 w-5 rounded-md border transition-transform hover:scale-110 ${currentTextColor === color ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-1.5">
        <button
          type="button"
          onClick={onClear}
          className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent"
        >
          <Undo2 className="h-3 w-3" />
          {language === 'zh' ? '清除颜色' : 'Clear'}
        </button>
        <input
          type="color"
          value={currentTextColor || '#3b82f6'}
          onChange={(e) => onPick(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
          title={language === 'zh' ? '自定义颜色' : 'Custom color'}
        />
      </div>
    </div>
  );
}

interface UploadedImage {
  name: string;
  path: string;
  size: number;
  modifiedTime: Date;
}

interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  timestamp?: string;
  command?: string;
}

export default function Home() {
  const [hexoPath, setHexoPath] = useState<string>('');
  const [isValidHexoProject, setIsValidHexoProject] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postContent, setPostContent] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [mainView, setMainView] = useState<string>('posts');
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [serverProcess, setServerProcess] = useState<any>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [currentTheme, setCurrentTheme] = useState<AppThemeName>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{ type: 'tag' | 'category'; value: string } | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [allTagsForCloud, setAllTagsForCloud] = useState<string[]>([]);
  const [publishStatsData, setPublishStatsData] = useState<any[]>([]); // 发布统计数据
  // 面板设置相关状态
  const [postsPerPage, setPostsPerPage] = useState<number>(15); // 默认每页显示15篇文章
  const [currentPage, setCurrentPage] = useState<number>(1); // 当前页码
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(3); // 默认自动保存间隔为3分钟
  const [iframeUrlMode, setIframeUrlMode] = useState<'hexo' | 'root'>('hexo'); // iframe地址获取方式，默认为hexo标准地址
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null); // 自动保存定时器
  const [editorMode, setEditorMode] = useState<'mode1' | 'mode2'>('mode1'); // 编辑模式，默认为模式1
  const [isUsingExternalEditor, setIsUsingExternalEditor] = useState<boolean>(false); // 是否使用外部编辑器
  // 背景图相关状态
  const [backgroundImage, setBackgroundImage] = useState<string>(''); // 背景图片URL
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1); // 背景透明度
  const [imageBaseUrl, setImageBaseUrl] = useState<string>('https://kivvs.github.io/images/'); // 图片引用基础地址
  const [giscusRepo, setGiscusRepo] = useState<string>(''); // Giscus GitHub 仓库
  const [giscusCategory, setGiscusCategory] = useState<string>(''); // Giscus Discussion 分类
  const [giscusToken, setGiscusToken] = useState<string>(''); // GitHub Token，用于读取 Giscus 评论数据
  const [ga4PropertyId, setGa4PropertyId] = useState<string>(''); // GA4 Property ID
  const [ga4ServiceAccountJson, setGa4ServiceAccountJson] = useState<string>(''); // GA4 服务账号 JSON
  
  // 更新检查相关状态
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updateCheckInProgress, setUpdateCheckInProgress] = useState<boolean>(false);
  const [autoCheckUpdates, setAutoCheckUpdates] = useState<boolean>(true);

  // 日志记录相关状态
  const [commandLogs, setCommandLogs] = useState<CommandResult[]>([]); // 存储所有命令执行结果
  const [showLogsDialog, setShowLogsDialog] = useState<boolean>(false); // 控制日志对话框显示
  

  // 推送设置相关状态
  const [enablePush, setEnablePush] = useState<boolean>(false); // 是否启用推送
  const [pushRepoUrl, setPushRepoUrl] = useState<string>(''); // 推送仓库地址
  const [pushBranch, setPushBranch] = useState<string>('main'); // 推送分支
  const [pushUsername, setPushUsername] = useState<string>(''); // 推送用户名
  const [pushEmail, setPushEmail] = useState<string>(''); // 推送邮箱

  // 自定义指令相关状态
  const [enableCustomCommands, setEnableCustomCommands] = useState<boolean>(false); // 是否启用自定义指令
  const [customCleanCommand, setCustomCleanCommand] = useState<string>('hexo clean'); // 自定义清理指令
  const [customGenerateCommand, setCustomGenerateCommand] = useState<string>('hexo generate'); // 自定义生成指令
  const [customServerCommand, setCustomServerCommand] = useState<string>('hexo server'); // 自定义启动服务器指令
  const [customDeployCommand, setCustomDeployCommand] = useState<string>('hexo deploy'); // 自定义部署指令

  // AI设置相关状态
  const [enableAI, setEnableAI] = useState<boolean>(false); // 是否启用AI
  const [enableEditorAI, setEnableEditorAI] = useState<boolean>(false); // 是否启用编辑器AI增强
  const [aiProvider, setAIProvider] = useState<'deepseek' | 'openai' | 'siliconflow'>('deepseek'); // AI提供商
  const [apiKey, setApiKey] = useState<string>(''); // API密钥
  const [prompt, setPrompt] = useState<string>('你是一个灵感提示机器人，我是一个独立博客的博主，我想写一篇博客，请你给我一个可写内容的灵感，不要超过200字，不要分段'); // 提示词
  const [analysisPrompt, setAnalysisPrompt] = useState<string>('你是一个文章分析机器人，以下是我的博客数据{content}，请你分析并给出鼓励性的话语，不要超过200字，不要分段'); // 分析提示词
  const [aiRewritePrompt, setAiRewritePrompt] = useState<string>('请直接重写以下文本，使其更清晰流畅，保持原意。只输出改写后的文本，不要添加任何解释或说明'); // AI重写提示词
  const [aiImprovePrompt, setAiImprovePrompt] = useState<string>('请直接改进以下文本，使其更专业、生动。只输出改进后的文本，不要添加任何解释或说明'); // AI改进提示词
  const [aiExpandPrompt, setAiExpandPrompt] = useState<string>('请扩展以下文本，适当添加细节。只输出扩展后的文本，不要添加解释或标注'); // AI扩展提示词
  const [aiTranslatePrompt, setAiTranslatePrompt] = useState<string>('请直接将以下文本翻译成英文。只输出翻译结果，不要添加任何解释或说明'); // AI翻译提示词
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-3.5-turbo'); // OpenAI模型
  const [openaiApiEndpoint, setOpenaiApiEndpoint] = useState<string>('https://api.openai.com/v1'); // OpenAI API端点
  const [openaiApiPath, setOpenaiApiPath] = useState<string>('/chat/completions'); // OpenAI API请求路径后缀
  const [showInspirationDialog, setShowInspirationDialog] = useState<boolean>(false); // 是否显示灵感对话框
  const [showAnalysisDialog, setShowAnalysisDialog] = useState<boolean>(false); // 是否显示分析对话框
  const [showDiagnosticDialog, setShowDiagnosticDialog] = useState<boolean>(false); // 是否显示 AI 辅助诊断对话框
  const [showDeletePostDialog, setShowDeletePostDialog] = useState<boolean>(false); // 是否显示删除文章确认对话框
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]); // Hexo source/images 目录图片
  const [isExtractingImages, setIsExtractingImages] = useState<boolean>(false); // 图片提取状态
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false); // 图片上传状态
  const [isImageDragOver, setIsImageDragOver] = useState<boolean>(false); // 图片管理卡片拖拽状态
  const [imageViewMode, setImageViewMode] = useState<'list' | 'grid'>('grid'); // 图片展示模式
  const [imageArticleTags, setImageArticleTags] = useState<Record<string, string>>({}); // 图片对应文章标签（仅软件内使用）
  const [imageArticleFilter, setImageArticleFilter] = useState<string>('all'); // 图片文章标签筛选
  const [showImagePickerDialog, setShowImagePickerDialog] = useState<boolean>(false); // 图片引用选择对话框
  const imageManagerDropAreaRef = React.useRef<HTMLDivElement>(null); // 图片管理拖拽区域
  // 字体颜色功能相关状态
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState<boolean>(false); // 字体颜色选择器展开状态
  const [currentTextColor, setCurrentTextColor] = useState<string>(''); // 最近使用的字体颜色
  const textColorAnchorRef = React.useRef<HTMLDivElement>(null); // 颜色按钮容器 ref（Portal 定位锚点）
  // 预览模式相关状态
  const [previewMode, setPreviewMode] = useState<'static' | 'server'>('static'); // 预览模式，默认为静态预览
  const [forcePreviewRefresh, setForcePreviewRefresh] = useState<boolean>(false); // 控制预览框强制刷新
  
  // 分屏比例相关状态
  const [splitRatio, setSplitRatio] = useState<number>(0.5); // 编辑器和预览框的宽度比例，默认为50%
  const [isDragging, setIsDragging] = useState<boolean>(false); // 是否正在拖动分隔条

  // 获取当前语言的文本
  const t = getTexts(language);
  
  // 初始化 toast hook
  const { toast } = useToast();

  // 检查是否在桌面应用环境中（Electron 或 Tauri）
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    // 在客户端检测桌面应用环境
    setIsElectron(isDesktopApp());
  }, []);

  // 处理每页显示文章数量变化
  const handlePostsPerPageChange = (value: number) => {
    setPostsPerPage(value);
    // 重置到第一页
    setCurrentPage(1);
  };

  // 处理自动保存间隔变化
  const handleAutoSaveIntervalChange = (value: number) => {
    setAutoSaveInterval(value);
    // 重新设置自动保存定时器
    setupAutoSaveTimer();
  };

  // 设置自动保存定时器
  const setupAutoSaveTimer = () => {
    // 清除现有定时器
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      setAutoSaveTimer(null);
    }

    // 设置新的定时器
    if (selectedPost && postContent) {
      const timer = setInterval(() => {
        savePost();
      }, autoSaveInterval * 60 * 1000); // 转换为毫秒
      setAutoSaveTimer(timer);
    }
  };

  // 当postContent变化时重置自动保存定时器
  useEffect(() => {
    if (selectedPost && postContent) {
      setupAutoSaveTimer();
    }
  }, [postContent]);

  // 组件卸载时清除自动保存定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // 当selectedPost变化时重置自动保存定时器
  useEffect(() => {
    if (selectedPost) {
      setupAutoSaveTimer();
    } else {
      // 如果没有选中的文章，清除自动保存定时器
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        setAutoSaveTimer(null);
      }
    }
  }, [selectedPost]);

  // 当autoSaveInterval变化时重置自动保存定时器
  useEffect(() => {
    if (selectedPost && postContent) {
      setupAutoSaveTimer();
    }
  }, [autoSaveInterval]);

  // 当backgroundImage变化时更新背景
  useEffect(() => {
    const updateBackgroundImage = async () => {
      if (typeof window !== 'undefined') {
        if (backgroundImage) {
          // 检测是否是本地文件路径（Windows或Unix路径）
          const isLocalPath = /^([a-zA-Z]:[\\/]|\/|\.\.?\/)/.test(backgroundImage) && 
                             !backgroundImage.startsWith('data:') &&
                             !backgroundImage.startsWith('http://') &&
                             !backgroundImage.startsWith('https://') &&
                             !backgroundImage.startsWith('asset://');
          
          if (isLocalPath && isDesktopApp()) {
            try {
              // 使用统一的环境检测函数
              const { isTauri } = await import('@/lib/desktop-api');
              const isTauriEnv = isTauri();
              
              console.log('环境检测结果:', {
                isTauri: isTauriEnv,
                backgroundImage
              });
              
              if (isTauriEnv) {
                // Tauri 环境使用 convertFileSrc（推荐方式，无需 base64 编码）
                const { convertFileSrc } = await import('@tauri-apps/api/core');
                const assetUrl = convertFileSrc(backgroundImage);
                document.documentElement.style.setProperty('--bg-image', `url(${assetUrl})`);
                console.log('设置背景图片 (Tauri asset URL):', assetUrl);
              } else {
                // Electron 环境使用 file:// 协议
                const normalizedPath = backgroundImage.replace(/\\/g, '/');
                const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
                document.documentElement.style.setProperty('--bg-image', `url(${fileUrl})`);
                console.log('设置背景图片 (Electron file://):', fileUrl);
              }
            } catch (error) {
              console.error('读取本地背景图片失败:', error);
              document.documentElement.style.setProperty('--bg-image', 'none');
            }
          } else {
            // URL或已经是base64格式，直接使用
            document.documentElement.style.setProperty('--bg-image', `url(${backgroundImage})`);
            console.log('设置背景图片:', backgroundImage);
          }
        } else {
          document.documentElement.style.setProperty('--bg-image', 'none');
          console.log('清除背景图片');
        }
      }
    };
    
    updateBackgroundImage();
  }, [backgroundImage]);

  // 当backgroundOpacity变化时更新背景透明度
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--bg-opacity', backgroundOpacity.toString());
      console.log('设置背景透明度:', backgroundOpacity);
    }
  }, [backgroundOpacity]);



  // 当主题配置变化时应用主题，并在跟随系统时监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateAppliedTheme = () => {
      const appliedTheme = applyAppTheme(currentTheme);
      setIsDarkMode(isAppThemeDark(appliedTheme));
    };

    updateAppliedTheme();

    if (currentTheme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateAppliedTheme);

    return () => mediaQuery.removeEventListener('change', updateAppliedTheme);
  }, [currentTheme]);

  // 组件加载时，尝试从localStorage加载上次选择的路径和语言设置，并检查更新
  useEffect(() => {
    const loadSavedSettings = async () => {
      // 从localStorage加载自动更新设置
      if (typeof window !== 'undefined') {
        const savedAutoCheckUpdates = localStorage.getItem('auto-check-updates');
        if (savedAutoCheckUpdates !== null) {
          setAutoCheckUpdates(savedAutoCheckUpdates === 'true');
        }
      }
      
      // 检查更新
      if (autoCheckUpdates) {
        await checkForUpdates(true); // 启动时静默检查
      }
      if (typeof window !== 'undefined') {
        // 加载语言设置
        const savedLanguage = localStorage.getItem('app-language') as Language;
        if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
          setLanguage(savedLanguage);
        }

        // 加载主题设置
        const savedTheme = getStoredAppTheme();
        setCurrentTheme(savedTheme);
        const appliedTheme = applyAppTheme(savedTheme);
        setIsDarkMode(isAppThemeDark(appliedTheme));

        // 加载每页显示文章数量设置
        const savedPostsPerPage = localStorage.getItem('posts-per-page');
        if (savedPostsPerPage) {
          const value = parseInt(savedPostsPerPage, 10);
          if (!isNaN(value) && value >= 1 && value <= 100) {
            setPostsPerPage(value);
          }
        }

        // 加载自动保存间隔设置
        const savedAutoSaveInterval = localStorage.getItem('auto-save-interval');
        if (savedAutoSaveInterval) {
          const value = parseInt(savedAutoSaveInterval, 10);
          if (!isNaN(value) && value >= 1 && value <= 60) {
            setAutoSaveInterval(value);
          }
        } else {
          // 如果没有保存的设置，使用默认值3分钟
          setAutoSaveInterval(3);
        }

        // 加载编辑模式设置
        const savedEditorMode = localStorage.getItem('editor-mode');
        if (savedEditorMode === 'mode1' || savedEditorMode === 'mode2') {
          setEditorMode(savedEditorMode);
        } else {
          // 如果没有保存的设置，使用默认值mode1
          setEditorMode('mode1');
        }

        // 加载背景图设置
        const savedBackgroundImage = localStorage.getItem('background-image');
        if (savedBackgroundImage !== null) {
          setBackgroundImage(savedBackgroundImage);
        }

        // 加载背景透明度设置
        const savedBackgroundOpacity = localStorage.getItem('background-opacity');
        if (savedBackgroundOpacity !== null) {
          const value = parseFloat(savedBackgroundOpacity);
          if (!isNaN(value) && value >= 0 && value <= 1) {
            setBackgroundOpacity(value);
          }
        }

        // 加载图片引用基础地址
        const savedImageBaseUrl = localStorage.getItem('image-base-url');
        if (savedImageBaseUrl !== null) {
          setImageBaseUrl(savedImageBaseUrl);
        }

        // 加载外部数据统计配置
        const savedGiscusRepo = localStorage.getItem('giscus-repo');
        if (savedGiscusRepo !== null) {
          setGiscusRepo(savedGiscusRepo);
        }

        const savedGiscusCategory = localStorage.getItem('giscus-category');
        if (savedGiscusCategory !== null) {
          setGiscusCategory(savedGiscusCategory);
        }

        const savedGiscusToken = localStorage.getItem('giscus-token');
        if (savedGiscusToken !== null) {
          setGiscusToken(savedGiscusToken);
        }

        const savedGa4PropertyId = localStorage.getItem('ga4-property-id');
        if (savedGa4PropertyId !== null) {
          setGa4PropertyId(savedGa4PropertyId);
        }

        const savedGa4ServiceAccountJson = localStorage.getItem('ga4-service-account-json');
        if (savedGa4ServiceAccountJson !== null) {
          setGa4ServiceAccountJson(savedGa4ServiceAccountJson);
        }
        
        // 加载推送设置
        const savedEnablePush = localStorage.getItem('enable-push');
        if (savedEnablePush !== null) {
          setEnablePush(savedEnablePush === 'true');
        }
        
        const savedPushRepoUrl = localStorage.getItem('push-repo-url');
        if (savedPushRepoUrl !== null) {
          setPushRepoUrl(savedPushRepoUrl);
        }
        
        const savedPushBranch = localStorage.getItem('push-branch');
        if (savedPushBranch !== null) {
          setPushBranch(savedPushBranch);
        }
        
        const savedPushUsername = localStorage.getItem('push-username');
        if (savedPushUsername !== null) {
          setPushUsername(savedPushUsername);
        }
        
        const savedPushEmail = localStorage.getItem('push-email');
        if (savedPushEmail !== null) {
          setPushEmail(savedPushEmail);
        }

        // 加载自定义指令设置
        const savedEnableCustomCommands = localStorage.getItem('enable-custom-commands');
        if (savedEnableCustomCommands !== null) {
          setEnableCustomCommands(savedEnableCustomCommands === 'true');
        }

        const savedCustomCleanCommand = localStorage.getItem('custom-clean-command');
        if (savedCustomCleanCommand !== null) {
          setCustomCleanCommand(savedCustomCleanCommand);
        }

        const savedCustomGenerateCommand = localStorage.getItem('custom-generate-command');
        if (savedCustomGenerateCommand !== null) {
          setCustomGenerateCommand(savedCustomGenerateCommand);
        }

        const savedCustomServerCommand = localStorage.getItem('custom-server-command');
        if (savedCustomServerCommand !== null) {
          setCustomServerCommand(savedCustomServerCommand);
        }

        const savedCustomDeployCommand = localStorage.getItem('custom-deploy-command');
        if (savedCustomDeployCommand !== null) {
          setCustomDeployCommand(savedCustomDeployCommand);
        }

        // 加载AI设置
        const savedEnableAI = localStorage.getItem('enable-ai');
        if (savedEnableAI !== null) {
          setEnableAI(savedEnableAI === 'true');
        }

        const savedEnableEditorAI = localStorage.getItem('enable-editor-ai');
        if (savedEnableEditorAI !== null) {
          setEnableEditorAI(savedEnableEditorAI === 'true');
        }

        const savedAIProvider = localStorage.getItem('ai-provider');
        if (savedAIProvider === 'deepseek' || savedAIProvider === 'openai' || savedAIProvider === 'siliconflow') {
          setAIProvider(savedAIProvider);
        }

        const savedApiKey = localStorage.getItem('api-key');
        if (savedApiKey !== null) {
          setApiKey(savedApiKey);
        }

        const savedPrompt = localStorage.getItem('prompt');
        if (savedPrompt !== null) {
          setPrompt(savedPrompt);
        } else {
          // 设置默认提示词
          setPrompt('你是一个灵感提示机器人，我是一个独立博客的博主，我想写一篇博客，请你给我一个可写内容的灵感，不要超过200字，不要分段');
        }

        const savedAnalysisPrompt = localStorage.getItem('analysis-prompt');
        if (savedAnalysisPrompt !== null) {
          setAnalysisPrompt(savedAnalysisPrompt);
        } else {
          // 设置默认分析提示词
          setAnalysisPrompt('你是一个文章分析机器人，以下是我的博客数据{content}，请你分析并给出鼓励性的话语，不要超过200字，不要分段');
        }

        const savedAiRewritePrompt = localStorage.getItem('ai-rewrite-prompt');
        if (savedAiRewritePrompt !== null) {
          setAiRewritePrompt(savedAiRewritePrompt);
        }

        const savedAiImprovePrompt = localStorage.getItem('ai-improve-prompt');
        if (savedAiImprovePrompt !== null) {
          setAiImprovePrompt(savedAiImprovePrompt);
        }

        const savedAiExpandPrompt = localStorage.getItem('ai-expand-prompt');
        if (savedAiExpandPrompt !== null) {
          setAiExpandPrompt(savedAiExpandPrompt);
        }

        const savedAiTranslatePrompt = localStorage.getItem('ai-translate-prompt');
        if (savedAiTranslatePrompt !== null) {
          setAiTranslatePrompt(savedAiTranslatePrompt);
        }

        const savedOpenaiModel = localStorage.getItem('openai-model');
        if (savedOpenaiModel !== null) {
          setOpenaiModel(savedOpenaiModel);
        }

        const savedOpenaiApiEndpoint = localStorage.getItem('openai-api-endpoint');
        if (savedOpenaiApiEndpoint !== null) {
          setOpenaiApiEndpoint(savedOpenaiApiEndpoint);
        }

        const savedOpenaiApiPath = localStorage.getItem('openai-api-path');
        if (savedOpenaiApiPath !== null) {
          setOpenaiApiPath(savedOpenaiApiPath);
        }

        // 加载预览模式设置
        const savedPreviewMode = localStorage.getItem('preview-mode');
        if (savedPreviewMode === 'static' || savedPreviewMode === 'server') {
          setPreviewMode(savedPreviewMode);
        } else {
          // 如果没有保存的设置，使用默认值static
          setPreviewMode('static');
        }

        // 加载项目路径
        const savedPath = localStorage.getItem('hexo-project-path');
        if (savedPath && isElectron) {
          const normalizedPath = normalizePath(savedPath);
          setHexoPath(normalizedPath);
          // 同时更新 localStorage 中的路径
          localStorage.setItem('hexo-project-path', normalizedPath);
          await validateHexoProject(normalizedPath);
        }
      }
      
      // 检查更新
      await checkForUpdates(true); // 启动时静默检查
    };

    loadSavedSettings();
  }, [isElectron]);

  // 页面加载完成后显示窗口（仅 Tauri 环境）
  useEffect(() => {
    const showWindow = async () => {
      if (isTauri()) {
        try {
          const { windowControls } = await import('@/lib/tauri-api');
          // 等待一小段时间确保页面渲染完成
          setTimeout(async () => {
            await windowControls.show();
          }, 100);
        } catch (error) {
          console.error('Failed to show window:', error);
        }
      }
    };
    
    showWindow();
  }, []);

  // 监听筛选条件变化
  useEffect(() => {
    applyFilter();
  }, [currentFilter, posts]);

  // 切换语言
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', newLanguage);
    }
  };

  // 应用主题配置
  const handleThemeChange = (themeName: AppThemeName) => {
    const appliedTheme = setAppTheme(themeName);
    setCurrentTheme(themeName);
    setIsDarkMode(isAppThemeDark(appliedTheme));
  };

  // 将选中文字包裹为 <font color> 标签（字体颜色功能）
  const handleTextColor = (color: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postContent.substring(start, end);

    // 若选中文本已被 <font color> 包裹则先去除，再套新颜色（避免嵌套）
    const stripped = selectedText.replace(/^<font\s+color\s*=\s*["'][^"']*["'][^>]*>([\s\S]*?)<\/font>\s*$/, '$1');
    const colorTag = `<font color="${color}">${stripped}</font>`;

    const newValue = postContent.substring(0, start) + colorTag + postContent.substring(end);
    setPostContent(newValue);
    setCurrentTextColor(color);

    setTimeout(() => {
      if (stripped.length === 0) {
        const newPos = start + `<font color="${color}">`.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      } else {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + colorTag.length;
      }
      textarea.focus();
    }, 0);
  };

  // 清除选中文字的字体颜色
  const handleClearTextColor = () => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postContent.substring(start, end);

    const cleaned = selectedText.replace(/^<font\s+color\s*=\s*["'][^"']*["'][^>]*>([\s\S]*?)<\/font>\s*$/, '$1');
    if (cleaned === selectedText) return;

    const newValue = postContent.substring(0, start) + cleaned + postContent.substring(end);
    setPostContent(newValue);
    setCurrentTextColor('');

    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + cleaned.length;
      textarea.focus();
    }, 0);
  };

  // 清理富文本格式：删除语雀等 <font style> 标签，保留包裹内容
  const handleCleanRichText = () => {
    const cleaned = cleanRichTextHtml(postContent);
    if (cleaned === postContent) {
      toast({
        title: language === 'zh' ? '未发现需清理的格式' : 'Nothing to clean',
        description: language === 'zh'
          ? '当前内容中没有 <font style="..."> 等富文本标签'
          : 'No rich text style tags found in the current content',
        variant: 'default',
      });
      return;
    }
    setPostContent(cleaned);
    toast({
      title: language === 'zh' ? '格式已清理' : 'Format cleaned',
      description: language === 'zh' ? '已移除富文本样式标签，保留文字内容' : 'Removed rich text style tags, kept the text content',
      variant: 'success',
    });
  };

  // 一键切换主题
  const toggleTheme = () => {
    const nextTheme = getNextAppTheme(currentTheme);
    handleThemeChange(nextTheme);

    const themeLabel = getAppThemeOption(nextTheme).label[language];
    toast({
      title: language === 'zh' ? '主题已切换' : 'Theme switched',
      description: language === 'zh' ? `当前主题：${themeLabel}` : `Current theme: ${themeLabel}`,
      variant: 'success',
    });
  };

  // 清除保存的项目路径
  const clearSavedPath = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hexo-project-path');
    }
    setHexoPath('');
    setIsValidHexoProject(false);
    setValidationMessage('');
    setPosts([]);
    setSelectedPost(null);
    setPostContent('');
  };
  
  // 处理自动更新设置变化
  const handleAutoCheckUpdatesChange = (value: boolean) => {
    setAutoCheckUpdates(value);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auto-check-updates', value.toString());
    }
  };
  
  // 检查更新
  const checkForUpdates = async (silent = false) => {
    if (!isElectron) return;
    
    if (!silent) {
      setUpdateCheckInProgress(true);
    }
    
    try {
      const ipcRenderer = await getIpcRenderer();
      const result = await ipcRenderer.invoke('check-for-updates');
      
      if (result.success) {
        setUpdateInfo(result);
        setUpdateAvailable(result.updateAvailable);
        
        // 如果有更新且不是静默检查，显示通知
        if (result.updateAvailable && !silent) {
          toast({
            title: '发现新版本',
            description: `新版本 ${result.latestVersion} 已发布`,
            variant: 'default',
          });
        } else if (!result.updateAvailable && !silent) {
          toast({
            title: '已是最新版本',
            description: `当前版本 ${result.currentVersion} 已是最新`,
            variant: 'success',
          });
        }
        
        // 如果是静默检查且有更新，显示通知
        if (result.updateAvailable && silent) {
          toast({
            title: '发现新版本',
            description: `新版本 ${result.latestVersion} 已发布，点击设置查看详情`,
            variant: 'default',
          });
        }
      } else if (!silent) {
        toast({
          title: '检查更新失败',
          description: result.error,
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      if (!silent) {
        toast({
          title: '检查更新失败',
          description: error instanceof Error ? error.message : '未知错误',
          variant: 'error',
        });
      }
    } finally {
      if (!silent) {
        setUpdateCheckInProgress(false);
      }
    }
  };

  // 选择Hexo项目目录
  const selectHexoDirectory = async () => {
    if (!isElectron) {
      toast({
        title: t.onlyAvailableInDesktop,
        variant: "destructive",
      });
      return;
    }

    try {
      const ipcRenderer = await getIpcRenderer();
      const selectedPath = await ipcRenderer.invoke('select-directory');

      if (selectedPath) {
        const normalizedPath = normalizePath(selectedPath);
        setHexoPath(normalizedPath);
        // 保存规范化后的路径到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('hexo-project-path', normalizedPath);
        }
        await validateHexoProject(normalizedPath);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      setValidationMessage('选择目录失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 验证Hexo项目
  const validateHexoProject = async (path: string) => {
    if (!isElectron) return;

    try {
      const ipcRenderer = await getIpcRenderer();
      const result = await ipcRenderer.invoke('validate-hexo-project', path, language);

      setIsValidHexoProject(result.valid);
      setValidationMessage(result.message);

      if (result.valid) {
        await loadPosts(path);
        await loadImageFiles(path);
        loadImageArticleTags(path);
      }
    } catch (error) {
      console.error('验证项目失败:', error);
      setValidationMessage('验证项目失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getImagesDirectoryPath = (projectPath: string = hexoPath) => `${projectPath}/source/images`;

  const getImageArticleTagsStorageKey = (projectPath: string = hexoPath) => `hexohub:image-article-tags:${projectPath}`;

  const loadImageArticleTags = (projectPath: string = hexoPath) => {
    if (typeof window === 'undefined' || !projectPath) return;

    try {
      const savedTags = localStorage.getItem(getImageArticleTagsStorageKey(projectPath));
      setImageArticleTags(savedTags ? JSON.parse(savedTags) : {});
      setImageArticleFilter('all');
    } catch (error) {
      console.error('加载图片文章标签失败:', error);
      setImageArticleTags({});
    }
  };

  const persistImageArticleTags = (nextTags: Record<string, string>, projectPath: string = hexoPath) => {
    setImageArticleTags(nextTags);

    if (typeof window !== 'undefined' && projectPath) {
      localStorage.setItem(getImageArticleTagsStorageKey(projectPath), JSON.stringify(nextTags));
    }
  };

  const getImageArticleTag = (imageName: string) => imageArticleTags[imageName] || '';

  const getNormalizedImageBaseUrl = (baseUrl: string) => {
    const trimmed = baseUrl.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  };

  const getImageReferenceUrl = (imageName: string) => {
    const baseUrl = getNormalizedImageBaseUrl(imageBaseUrl);
    return `${baseUrl}${imageName}`;
  };

  const updateImageArticleTag = (imageName: string, articleTitle: string) => {
    const nextTags = { ...imageArticleTags };

    if (articleTitle) {
      nextTags[imageName] = articleTitle;
    } else {
      delete nextTags[imageName];
    }

    persistImageArticleTags(nextTags);
  };

  const normalizeDesktopFileInfoTime = (modifiedTime: unknown): Date => {
    if (modifiedTime instanceof Date) {
      return modifiedTime;
    }

    if (typeof modifiedTime === 'string') {
      const timestamp = parseInt(modifiedTime, 10);
      return Number.isNaN(timestamp) ? new Date(0) : new Date(timestamp);
    }

    return new Date(0);
  };

  const isSupportedImageName = (name: string) => /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(name);

  const formatUploadedImageSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const loadImageFiles = async (projectPath: string = hexoPath) => {
    if (!isElectron || !projectPath) return;

    try {
      const ipcRenderer = await getIpcRenderer();
      const imageDirectoryPath = getImagesDirectoryPath(projectPath);
      const files = await ipcRenderer.invoke('list-files', imageDirectoryPath);
      const imageFiles = files
        .filter((file: any) => !file.isDirectory && isSupportedImageName(file.name))
        .map((file: any) => ({
          name: file.name,
          path: file.path,
          size: file.size || 0,
          modifiedTime: normalizeDesktopFileInfoTime(file.modifiedTime),
        }))
        .sort((a: UploadedImage, b: UploadedImage) => b.modifiedTime.getTime() - a.modifiedTime.getTime());

      setUploadedImages(imageFiles);
    } catch (error) {
      console.warn('加载图片列表失败，可能是 source/images 目录尚未创建:', error);
      setUploadedImages([]);
    }
  };

  // 将网络图片写入 source/images（兼容 Electron 与 Tauri）
  const writeRemoteImageToSourceImages = async (destinationPath: string, bytes: Uint8Array) => {
    const ipcRenderer = await getIpcRenderer();

    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_file_from_buffer', {
        filePath: destinationPath,
        bytes: Array.from(bytes),
      });
      return;
    }

    await ipcRenderer.invoke('write-file-from-buffer', destinationPath, bytes);
  };

  // 下载远程图片并返回字节数组
  const downloadRemoteImage = async (src: string): Promise<{ bytes: Uint8Array; contentType?: string | null }> => {
    if (isTauri()) {
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      const response = await tauriFetch(src);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return { bytes: new Uint8Array(arrayBuffer), contentType };
    }

    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    const arrayBuffer = await response.arrayBuffer();
    return { bytes: new Uint8Array(arrayBuffer), contentType };
  };

  // 提取当前文章中的外部图片：下载到 source/images、重命名、关联文章并替换正文引用
  const handleExtractImages = async () => {
    if (!isElectron || !hexoPath || !selectedPost) {
      toast({
        title: t.failed,
        description: t.selectValidHexoProject,
        variant: 'error',
      });
      return;
    }

    const matches = findImageSources(postContent);
    const remoteMatches = matches.filter((m) => /^https?:\/\//i.test(m.src));

    if (remoteMatches.length === 0) {
      toast({
        title: language === 'zh' ? '没有可提取的图片' : 'No images to extract',
        description: language === 'zh'
          ? '当前文章中没有发现外部网络图片引用（<img> 或 Markdown 图片语法）'
          : 'No external image references found in the current post',
        variant: 'error',
      });
      return;
    }

    if (isExtractingImages) return;

    setIsExtractingImages(true);

    // 文章名（去掉扩展名）作为图片名前缀
    const postBaseName = selectedPost.name.replace(/\.(md|markdown)$/i, '').trim() || 'post';

    try {
      const ipcRenderer = await getIpcRenderer();
      const imagesDirectoryPath = getImagesDirectoryPath(hexoPath);
      const existingNames = await ipcRenderer
        .invoke('list-files', imagesDirectoryPath)
        .then((files: any[]) => files.map((f: any) => f.name))
        .catch(() => [] as string[]);

      const replacements: Array<{ raw: string; replacement: string }> = [];
      const downloadedNames: string[] = [];
      const failedSources: string[] = [];

      // 基于当前关联状态初始化累加器，循环内累加、结束后统一持久化
      // （避免在循环内基于未更新的 state 展开导致关联被覆盖丢失）
      const nextTags: Record<string, string> = { ...imageArticleTags };

      for (let index = 0; index < remoteMatches.length; index++) {
        const match = remoteMatches[index];
        const sequence = index + 1;

        try {
          const { bytes, contentType } = await downloadRemoteImage(match.src);
          const extension = inferImageExtension(match.src, contentType);

          // 生成目标文件名：文章名-序号.扩展名，重名时递增序号
          let candidateName = `${postBaseName}-${sequence}.${extension}`;
          let collisionIndex = 1;
          while (existingNames.includes(candidateName)) {
            collisionIndex += 1;
            candidateName = `${postBaseName}-${sequence}-${collisionIndex}.${extension}`;
          }

          const destinationPath = `${imagesDirectoryPath}/${candidateName}`;
          await writeRemoteImageToSourceImages(destinationPath, bytes);
          existingNames.push(candidateName);

          const referenceUrl = getImageReferenceUrl(candidateName);
          if (match.kind === 'html') {
            replacements.push({ raw: match.raw, replacement: `![](${referenceUrl})` });
          } else {
            replacements.push({ raw: match.raw, replacement: `![图片](${referenceUrl})` });
          }

          downloadedNames.push(candidateName);

          // 将图片关联到当前文章（累加到本地状态，循环结束后统一保存）
          nextTags[candidateName] = postBaseName;
        } catch (error) {
          console.error(`提取图片失败 (${match.src}):`, error);
          failedSources.push(match.src);
        }
      }

      if (downloadedNames.length > 0) {
        // 统一持久化所有图片到当前文章的关联
        persistImageArticleTags(nextTags);

        // 替换正文中的引用
        const newContent = replaceImageSources(postContent, replacements);
        setPostContent(newContent);
        await ipcRenderer.invoke('write-file', selectedPost.path, newContent);

        await loadImageFiles(hexoPath);

        toast({
          title: language === 'zh' ? '图片提取完成' : 'Images extracted',
          description: language === 'zh'
            ? `已提取 ${downloadedNames.length} 张图片到 source/images 并自动关联到「${postBaseName}」${failedSources.length > 0 ? `，${failedSources.length} 张失败` : ''}`
            : `${downloadedNames.length} image(s) saved to source/images and linked to "${postBaseName}"${failedSources.length > 0 ? `, ${failedSources.length} failed` : ''}`,
          variant: failedSources.length > 0 ? 'default' : 'success',
        });
      } else {
        toast({
          title: t.failed,
          description: language === 'zh' ? '图片提取失败，请检查网络或图片地址' : 'Image extraction failed, check network or image URLs',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('图片提取失败:', error);
      toast({
        title: t.failed,
        description: language === 'zh' ? `图片提取失败: ${error instanceof Error ? error.message : String(error)}` : `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      });
    } finally {
      setIsExtractingImages(false);
    }
  };

  const copyImagePathToSourceImages = async (sourceImagePath: string) => {
    const normalizedSourceImagePath = normalizePath(sourceImagePath);
    const imageName = normalizedSourceImagePath.split(/[\\/]/).pop();

    if (!imageName || !isSupportedImageName(imageName)) {
      throw new Error(language === 'zh' ? '请选择有效的图片文件' : 'Please select a valid image file');
    }

    const ipcRenderer = await getIpcRenderer();
    const destinationPath = `${getImagesDirectoryPath()}/${imageName}`;
    await ipcRenderer.invoke('copy-file', normalizedSourceImagePath, destinationPath);
    return imageName;
  };

  const writeDroppedImageToSourceImages = async (file: File) => {
    if (!isSupportedImageName(file.name)) {
      throw new Error(language === 'zh' ? '仅支持图片文件' : 'Only image files are supported');
    }

    const filePath = (file as any).path;
    if (filePath) {
      return copyImagePathToSourceImages(filePath);
    }

    if (isTauri()) {
      throw new Error(language === 'zh' ? '当前环境拖拽上传需要文件路径，请使用“上传图片”按钮选择文件' : 'Drag upload in this environment requires a file path. Please use the upload button.');
    }

    const ipcRenderer = await getIpcRenderer();
    const destinationPath = `${getImagesDirectoryPath()}/${file.name}`;
    const fileContent = await file.arrayBuffer();
    await ipcRenderer.invoke('write-file-from-buffer', destinationPath, new Uint8Array(fileContent));
    return file.name;
  };

  const uploadImageToSourceImages = async () => {
    if (!isElectron || !hexoPath) {
      toast({
        title: t.failed,
        description: t.selectValidHexoProject,
        variant: 'error',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const ipcRenderer = await getIpcRenderer();
      const selectedImagePath = await ipcRenderer.invoke('select-file');

      if (!selectedImagePath) return;

      const imageName = await copyImagePathToSourceImages(String(selectedImagePath));
      await loadImageFiles(hexoPath);

      toast({
        title: t.success,
        description: language === 'zh' ? `图片已上传到 source/images/${imageName}` : `Image uploaded to source/images/${imageName}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      toast({
        title: t.failed,
        description: language === 'zh' ? `上传图片失败: ${error instanceof Error ? error.message : String(error)}` : `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploadingImage) {
      setIsImageDragOver(true);
    }
  };

  const handleImageDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsImageDragOver(false);
  };

  const handleImageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsImageDragOver(false);

    if (!isElectron || !hexoPath) return;

    const imageFiles = Array.from(event.dataTransfer.files).filter((file) => isSupportedImageName(file.name));
    if (imageFiles.length === 0) {
      toast({
        title: t.failed,
        description: language === 'zh' ? '请拖入图片文件' : 'Please drop image files',
        variant: 'error',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadedNames: string[] = [];
      for (const file of imageFiles) {
        const imageName = await writeDroppedImageToSourceImages(file);
        uploadedNames.push(imageName);
      }

      await loadImageFiles(hexoPath);

      toast({
        title: t.success,
        description: language === 'zh' ? `已拖拽上传 ${uploadedNames.length} 张图片` : `${uploadedNames.length} image(s) uploaded by drag and drop`,
        variant: 'success',
      });
    } catch (error) {
      console.error('拖拽上传图片失败:', error);
      toast({
        title: t.failed,
        description: language === 'zh' ? `拖拽上传失败: ${error instanceof Error ? error.message : String(error)}` : `Drag upload failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupTauriImageDragDrop = async () => {
      if (!isElectron || !hexoPath || !isTauri()) return;

      try {
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');
        const webview = getCurrentWebview();

        unlisten = await webview.onDragDropEvent(async (event) => {
          const { payload } = event;

          if (payload.type === 'over') {
            const dropArea = imageManagerDropAreaRef.current;
            if (!dropArea) return;

            const { left, right, top, bottom } = dropArea.getBoundingClientRect();
            const { x, y } = payload.position;
            setIsImageDragOver(x >= left && x <= right && y >= top && y <= bottom);
            return;
          }

          if (payload.type !== 'drop') {
            setIsImageDragOver(false);
            return;
          }

          const dropArea = imageManagerDropAreaRef.current;
          setIsImageDragOver(false);
          if (!dropArea) return;

          const { left, right, top, bottom } = dropArea.getBoundingClientRect();
          const { x, y } = payload.position;
          const isInDropArea = x >= left && x <= right && y >= top && y <= bottom;
          if (!isInDropArea) return;

          const imagePaths = (payload.paths || []).filter((filePath) => isSupportedImageName(filePath));
          if (imagePaths.length === 0) {
            toast({
              title: t.failed,
              description: language === 'zh' ? '请拖入图片文件' : 'Please drop image files',
              variant: 'error',
            });
            return;
          }

          setIsUploadingImage(true);

          try {
            for (const imagePath of imagePaths) {
              await copyImagePathToSourceImages(imagePath);
            }

            await loadImageFiles(hexoPath);
            toast({
              title: t.success,
              description: language === 'zh' ? `已拖拽上传 ${imagePaths.length} 张图片` : `${imagePaths.length} image(s) uploaded by drag and drop`,
              variant: 'success',
            });
          } catch (error) {
            console.error('Tauri 拖拽上传图片失败:', error);
            toast({
              title: t.failed,
              description: language === 'zh' ? `拖拽上传失败: ${error instanceof Error ? error.message : String(error)}` : `Drag upload failed: ${error instanceof Error ? error.message : String(error)}`,
              variant: 'error',
            });
          } finally {
            setIsUploadingImage(false);
          }
        });
      } catch (error) {
        console.error('设置图片管理 Tauri 拖拽监听失败:', error);
      }
    };

    setupTauriImageDragDrop();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [hexoPath, isElectron, language, t.failed, t.success]);

  const insertImageReference = (imageName: string) => {
    const textarea = document.querySelector('textarea');
    const insertText = `![](${getImageReferenceUrl(imageName)})`;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = postContent.substring(0, start) + insertText + postContent.substring(end);
      setPostContent(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
        textarea.focus();
      }, 0);
    } else {
      setPostContent(prev => `${prev}${prev.endsWith('\n') || prev.length === 0 ? '' : '\n'}${insertText}`);
    }

    setShowImagePickerDialog(false);
  };

  const normalizeImageRename = (oldName: string, inputName: string) => {
    const safeName = inputName.trim().replace(/[\\/]/g, '-');
    if (!safeName) return '';

    if (isSupportedImageName(safeName)) {
      return safeName;
    }

    const extension = oldName.match(/\.[^.]+$/)?.[0] || '';
    return `${safeName.replace(/\.[^.]*$/, '')}${extension}`;
  };

  const renameUploadedImage = async (image: UploadedImage) => {
    if (!isElectron || !hexoPath) return;

    const rawName = window.prompt(
      language === 'zh' ? '请输入新的图片名称（可不填扩展名）' : 'Enter a new image name (extension optional)',
      image.name
    );

    if (rawName === null) return;

    const newName = normalizeImageRename(image.name, rawName);
    if (!newName || newName === image.name) return;

    if (uploadedImages.some((item) => item.name === newName)) {
      toast({
        title: t.failed,
        description: language === 'zh' ? '已存在同名图片' : 'An image with the same name already exists',
        variant: 'error',
      });
      return;
    }

    try {
      const ipcRenderer = await getIpcRenderer();
      const newPath = `${getImagesDirectoryPath()}/${newName}`;
      await ipcRenderer.invoke('copy-file', image.path, newPath);
      await ipcRenderer.invoke('delete-file', image.path);

      const nextTags = { ...imageArticleTags };
      if (nextTags[image.name]) {
        nextTags[newName] = nextTags[image.name];
        delete nextTags[image.name];
        persistImageArticleTags(nextTags);
      }

      await loadImageFiles(hexoPath);

      toast({
        title: t.success,
        description: language === 'zh' ? `图片已重命名为 ${newName}` : `Image renamed to ${newName}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('重命名图片失败:', error);
      toast({
        title: t.failed,
        description: language === 'zh' ? `重命名图片失败: ${error instanceof Error ? error.message : String(error)}` : `Failed to rename image: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      });
    }
  };

  const deleteUploadedImage = async (image: UploadedImage) => {
    if (!isElectron || !hexoPath) return;

    const confirmed = window.confirm(
      language === 'zh'
        ? `确定要删除图片“${image.name}”吗？此操作不可撤销。`
        : `Delete image "${image.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const ipcRenderer = await getIpcRenderer();
      await ipcRenderer.invoke('delete-file', image.path);

      if (imageArticleTags[image.name]) {
        const nextTags = { ...imageArticleTags };
        delete nextTags[image.name];
        persistImageArticleTags(nextTags);
      }

      await loadImageFiles(hexoPath);

      toast({
        title: t.success,
        description: language === 'zh' ? `已删除图片 ${image.name}` : `Image ${image.name} deleted`,
        variant: 'success',
      });
    } catch (error) {
      console.error('删除图片失败:', error);
      toast({
        title: t.failed,
        description: language === 'zh' ? `删除图片失败: ${error instanceof Error ? error.message : String(error)}` : `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      });
    }
  };

  // 提取文章中的标签和分类
  const extractTagsAndCategories = async (posts: Post[]) => {
    if (!isElectron) return;

    const tagsSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const allTagsList: string[] = []; // 收集所有标签（包括重复的）用于标签云
    const frontmatterDates = new Map<string, Date>(); // 收集每篇文章的 frontmatter 日期

    try {
      const ipcRenderer = await getIpcRenderer();

      for (const post of posts) {
        try {
          // 读取文件内容
          const content = await ipcRenderer.invoke('read-file', post.path);

          // 解析front matter
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];

            // 提取 frontmatter 中的 date 字段
            const dateMatch = frontMatter.match(/^date:\s*(.+)$/m);
            if (dateMatch) {
              const dateStr = dateMatch[1].trim();
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                frontmatterDates.set(post.path, date);
              }
            }
            
            // 提取标签 - 支持多种 Hexo 格式
            const parseTags = (text: string): string[] => {
              // 1. 先把整个 frontmatter 按行分割成数组
              // 例如：['title: 测试', 'date: 2025-10-07', 'tags:', '  - 测试1', '  - 测试2', ...]
              const lines = text.split('\n');
              const tags: string[] = [];  // 用来存储找到的标签
              let inTagsSection = false;  // 标记：我们是否在 tags 区域内？
              
              // 2. 逐行遍历
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];           // 原始行（保留缩进）
                const trimmedLine = line.trim(); // 去掉前后空格的行
                
                // === 第一步：找到 tags: 这一行 ===
                if (trimmedLine.startsWith('tags:')) {
                  const afterColon = trimmedLine.substring(5).trim();  // 取 "tags:" 后面的内容
                  
                  // 格式1: tags: [tag1, tag2, tag3] - 行内数组格式
                  if (afterColon.startsWith('[')) {
                    const arrayMatch = afterColon.match(/\[(.*?)\]/);
                    if (arrayMatch) {
                      return arrayMatch[1]
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag);
                    }
                  }
                  // 格式2: tags: single-tag - 单个标签在同一行
                  else if (afterColon.length > 0) {
                    return [afterColon];
                  }
                  // 格式3: tags: 后面是空的，说明标签在下面的行（多行列表格式）
                  // 例如：
                  // tags:
                  //   - tag1
                  //   - tag2
                  else {
                    inTagsSection = true;  // 设置标记：我们进入 tags 区域了！
                    continue;              // 看下一行
                  }
                }
                
                // === 第二步：如果我们在 tags 区域内，开始收集标签 ===
                if (inTagsSection) {
                  // 退出条件：遇到一行不是以 - 开头，也不是缩进的行
                  // 例如遇到 "categories:" 或其他字段就退出
                  if (trimmedLine && !trimmedLine.startsWith('-') && !line.startsWith(' ') && !line.startsWith('\t')) {
                    break;  // 退出循环，不再收集
                  }
                  
                  // 收集标签：如果这行以 - 开头
                  if (trimmedLine.startsWith('-')) {
                    const tag = trimmedLine.substring(1).trim();  // 去掉 "-" 和空格，得到标签内容
                    if (tag) tags.push(tag);  // 添加到结果数组
                  }
                }
              }
              
              return tags;
            };
            
            const tags = parseTags(frontMatter);
            tags.forEach(tag => {
              tagsSet.add(tag);
              allTagsList.push(tag);
            });
            
            // 提取分类 - 支持多种 Hexo 格式（逻辑同 parseTags）
            const parseCategories = (text: string): string[] => {
              // 1. 先把整个 frontmatter 按行分割成数组
              const lines = text.split('\n');
              const categories: string[] = [];  // 用来存储找到的分类
              let inCategoriesSection = false;  // 标记：我们是否在 categories 区域内？
              
              // 2. 逐行遍历
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];           // 原始行（保留缩进）
                const trimmedLine = line.trim(); // 去掉前后空格的行
                
                // === 第一步：找到 categories: 这一行 ===
                if (trimmedLine.startsWith('categories:')) {
                  const afterColon = trimmedLine.substring(11).trim();  // 取 "categories:" 后面的内容
                  
                  // 格式1: categories: [cat1, cat2, cat3] - 行内数组格式
                  if (afterColon.startsWith('[')) {
                    const arrayMatch = afterColon.match(/\[(.*?)\]/);
                    if (arrayMatch) {
                      return arrayMatch[1]
                        .split(',')
                        .map(cat => cat.trim())
                        .filter(cat => cat);
                    }
                  }
                  // 格式2: categories: single-category - 单个分类在同一行
                  else if (afterColon.length > 0) {
                    return [afterColon];
                  }
                  // 格式3: categories: 后面是空的，说明分类在下面的行（多行列表格式）
                  // 例如：
                  // categories:
                  //   - cat1
                  //   - cat2
                  else {
                    inCategoriesSection = true;  // 设置标记：我们进入 categories 区域了！
                    continue;                    // 跳过当前行，继续看下一行
                  }
                }
                
                // === 第二步：如果我们在 categories 区域内，开始收集分类 ===
                if (inCategoriesSection) {
                  // 退出条件：遇到一行不是以 - 开头，也不是缩进的行
                  // 例如遇到其他字段就退出
                  if (trimmedLine && !trimmedLine.startsWith('-') && !line.startsWith(' ') && !line.startsWith('\t')) {
                    break;  // 退出循环，不再收集
                  }
                  
                  // 收集分类：如果这行以 - 开头
                  if (trimmedLine.startsWith('-')) {
                    const cat = trimmedLine.substring(1).trim();  // 去掉 "-" 和空格，得到分类内容
                    if (cat) categories.push(cat);  // 添加到结果数组
                  }
                }
              }
              
              return categories;
            };
            
            const categories = parseCategories(frontMatter);
            categories.forEach(category => categoriesSet.add(category));
          }
        } catch (error) {
          console.error(`读取文章 ${post.name} 失败:`, error);
        }
      }
      
      // 更新文章列表，添加 frontmatterDate
      if (frontmatterDates.size > 0) {
        setPosts(prevPosts => prevPosts.map(p => {
          const fmDate = frontmatterDates.get(p.path);
          return fmDate ? { ...p, frontmatterDate: fmDate } : p;
        }));
        setFilteredPosts(prevPosts => prevPosts.map(p => {
          const fmDate = frontmatterDates.get(p.path);
          return fmDate ? { ...p, frontmatterDate: fmDate } : p;
        }));
      }

      setAvailableTags(Array.from(tagsSet));
      setAvailableCategories(Array.from(categoriesSet));
      setAllTagsForCloud(allTagsList); // 设置所有标签列表
    } catch (error) {
      console.error('提取标签和分类失败:', error);
    }
  };

  // 提取标签 - 支持多种 Hexo 格式
  const parseTags = (text: string): string[] => {
    // 1. 先把整个 frontmatter 按行分割成数组
    // 例如：['title: 测试', 'date: 2025-10-07', 'tags:', '  - 测试1', '  - 测试2', ...]
    const lines = text.split('\n');
    const tags: string[] = [];  // 用来存储找到的标签
    let inTagsSection = false;  // 标记：我们是否在 tags 区域内？

    // 2. 逐行遍历
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];           // 原始行（保留缩进）
      const trimmedLine = line.trim(); // 去掉前后空格的行

      // === 第一步：找到 tags: 这一行 ===
      if (trimmedLine.startsWith('tags:')) {
        const afterColon = trimmedLine.substring(5).trim();  // 取 "tags:" 后面的内容

        // 格式1: tags: [tag1, tag2, tag3] - 行内数组格式
        if (afterColon.startsWith('[')) {
          const arrayMatch = afterColon.match(/\[(.*?)\]/);
          if (arrayMatch) {
            return arrayMatch[1]
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag);
          }
        }
        // 格式2: tags: single-tag - 单个标签在同一行
        else if (afterColon.length > 0) {
          return [afterColon];
        }
        // 格式3: tags: 后面是空的，说明标签在下面的行（多行列表格式）
        // 例如：
        // tags:
        //   - tag1
        //   - tag2
        else {
          inTagsSection = true;  // 设置标记：我们进入 tags 区域了！
          continue;              // 看下一行
        }
      }

      // === 第二步：如果我们在 tags 区域内，开始收集标签 ===
      if (inTagsSection) {
        // 退出条件：遇到一行不是以 - 开头，也不是缩进的行
        // 例如遇到 "categories:" 或其他字段就退出
        if (trimmedLine && !trimmedLine.startsWith('-') && !line.startsWith(' ') && !line.startsWith('\t')) {
          break;  // 退出循环，不再收集
        }

        // 收集标签：如果这行以 - 开头
        if (trimmedLine.startsWith('-')) {
          const tag = trimmedLine.substring(1).trim();  // 去掉 "-" 和空格，得到标签内容
          if (tag) tags.push(tag);  // 添加到结果数组
        }
      }
    }

    return tags;
  };

  // 提取分类 - 支持多种 Hexo 格式（逻辑同 parseTags）
  const parseCategories = (text: string): string[] => {
    // 1. 先把整个 frontmatter 按行分割成数组
    const lines = text.split('\n');
    const categories: string[] = [];  // 用来存储找到的分类
    let inCategoriesSection = false;  // 标记：我们是否在 categories 区域内？

    // 2. 逐行遍历
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];           // 原始行（保留缩进）
      const trimmedLine = line.trim(); // 去掉前后空格的行

      // === 第一步：找到 categories: 这一行 ===
      if (trimmedLine.startsWith('categories:')) {
        const afterColon = trimmedLine.substring(11).trim();  // 取 "categories:" 后面的内容

        // 格式1: categories: [cat1, cat2, cat3] - 行内数组格式
        if (afterColon.startsWith('[')) {
          const arrayMatch = afterColon.match(/\[(.*?)\]/);
          if (arrayMatch) {
            return arrayMatch[1]
              .split(',')
              .map(cat => cat.trim())
              .filter(cat => cat);
          }
        }
        // 格式2: categories: single-category - 单个分类在同一行
        else if (afterColon.length > 0) {
          return [afterColon];
        }
        // 格式3: categories: 后面是空的，说明分类在下面的行（多行列表格式）
        // 例如：
        // categories:
        //   - cat1
        //   - cat2
        else {
          inCategoriesSection = true;  // 设置标记：我们进入 categories 区域了！
          continue;                    // 跳过当前行，继续看下一行
        }
      }

      // === 第二步：如果我们在 categories 区域内，开始收集分类 ===
      if (inCategoriesSection) {
        // 退出条件：遇到一行不是以 - 开头，也不是缩进的行
        // 例如遇到其他字段就退出
        if (trimmedLine && !trimmedLine.startsWith('-') && !line.startsWith(' ') && !line.startsWith('\t')) {
          break;  // 退出循环，不再收集
        }

        // 收集分类：如果这行以 - 开头
        if (trimmedLine.startsWith('-')) {
          const cat = trimmedLine.substring(1).trim();  // 去掉 "-" 和空格，得到分类内容
          if (cat) categories.push(cat);  // 添加到结果数组
        }
      }
    }

    return categories;
  };

  // 应用筛选
  const applyFilter = async () => {
    if (!currentFilter) {
      setFilteredPosts(posts);
      return;
    }
    
    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      const filtered: Post[] = [];
      
      for (const post of posts) {
        try {
          // 读取文件内容
          const content = await ipcRenderer.invoke('read-file', post.path);
          
          // 解析front matter
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            
            if (currentFilter.type === 'tag') {
              // 使用新的parseTags函数检查标签
              const tags = parseTags(frontMatter);
              if (tags.includes(currentFilter.value)) {
                filtered.push(post);
              }
            } else if (currentFilter.type === 'category') {
              // 使用新的parseCategories函数检查分类
              const categories = parseCategories(frontMatter);
              if (categories.includes(currentFilter.value)) {
                filtered.push(post);
              }
            }
          }
        } catch (error) {
          console.error(`读取文章 ${post.name} 失败:`, error);
        }
      }
      
      setFilteredPosts(filtered);
    } catch (error) {
      console.error('应用筛选失败:', error);
      setFilteredPosts(posts);
    } finally {
      setIsLoading(false);
    }
  };

  // 按标签筛选
  const filterByTag = (tag: string) => {
    setCurrentFilter({ type: 'tag', value: tag });
    // 重置页码到第一页
    setCurrentPage(1);
  };

  // 按分类筛选
  const filterByCategory = (category: string) => {
    setCurrentFilter({ type: 'category', value: category });
    // 重置页码到第一页
    setCurrentPage(1);
  };

  // 清除筛选
  const clearFilter = () => {
    setCurrentFilter(null);
    // 重置页码到第一页
    setCurrentPage(1);
  };

  // 加载文章列表
  const loadPosts = async (path: string) => {
    if (!isElectron) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      // 递归获取所有markdown文件
      const getAllMarkdownFiles = async (dirPath: string): Promise<any[]> => {
        const files = await ipcRenderer.invoke('list-files', dirPath);
        const markdownFiles: any[] = [];

        for (const file of files) {
          if (file.isDirectory) {
            // 如果是目录，递归获取子目录中的markdown文件
            const subDirFiles = await getAllMarkdownFiles(file.path);
            markdownFiles.push(...subDirFiles);
          } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
            // 如果是markdown文件，添加到结果列表
            markdownFiles.push(file);
          }
        }

        return markdownFiles;
      };

      const allMarkdownFiles = await getAllMarkdownFiles(path + '/source/_posts');

      const markdownFiles = allMarkdownFiles.map((file: any) => {
          // 兼容 Electron 和 Tauri 两种格式
          // Electron: modifiedTime 是 Date 对象
          // Tauri: modifiedTime 是时间戳字符串
          let modifiedTime: Date;
          
          if (file.modifiedTime instanceof Date) {
            // Electron 格式：直接使用 Date 对象
            modifiedTime = file.modifiedTime;
          } else if (typeof file.modifiedTime === 'string') {
            // Tauri 格式：从时间戳字符串转换
            modifiedTime = new Date(parseInt(file.modifiedTime, 10));
          } else {
            // 备用方案
            modifiedTime = new Date(0);
          }
          
          return {
            ...file,
            modifiedTime
          };
        });

      setPosts(markdownFiles);
      setFilteredPosts(markdownFiles);
      
      // 提取标签和分类
      await extractTagsAndCategories(markdownFiles);
    } catch (error) {
      console.error('加载文章失败:', error);
      setValidationMessage('加载文章失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新文章
  const createNewPost = () => {
    if (!isElectron || !hexoPath) {
      alert(t.selectValidHexoProject);
      return;
    }
    setShowCreateDialog(true);
  };

  // 处理文章创建确认
  const handleCreatePostConfirm = async (postData: {
    title: string;
    tags: string[];
    categories: string[];
    excerpt?: string;
    template?: string;
  }) => {
    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();

      // 构建Hexo new命令
      let command = `new "${postData.title}"`;
      
      // 如果使用了自定义模板，则修改命令
      if (postData.template) {
        command = `new ${postData.template} "${postData.title}"`;
      }

      // 如果有标签或分类，创建文章后需要更新front matter
      const result = await ipcRenderer.invoke('execute-hexo-command', command, hexoPath);

      // 添加到日志
      const newLog = {
        ...result,
        timestamp: new Date().toLocaleString(),
        command: 'create post'
      };
      setCommandLogs(prev => [...prev, newLog]);
      setCommandResult(result);
      if (result.success) {
        // 显示成功通知
        toast({
          title: t.success,
          description: t.articleCreateSuccess,
          variant: 'success',
        });
        
        // 如果有额外的标签、分类或摘要，需要更新文件
        if (postData.tags.length > 0 || postData.categories.length > 0 || postData.excerpt) {
          await updatePostFrontMatter(postData);
        }

        // 延迟一点再加载文章列表，确保文件系统操作完成
        setTimeout(async () => {
          await loadPosts(hexoPath);
        }, 500);
      } else {
        // 显示失败通知
        toast({
          title: t.failed,
          description: t.createArticleFailedMsg,
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('创建文章失败:', error);
      const createErrorResult = {
        success: false,
        error: '创建文章失败: ' + (error instanceof Error ? error.message : '未知错误'),
        timestamp: new Date().toLocaleString(),
        command: 'create post'
      };
      setCommandLogs(prev => [...prev, createErrorResult]);
      setCommandResult(createErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: t.createArticleFailedMsg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
      setShowCreateDialog(false);
    }
  };

  // 更新文章的front matter
  const updatePostFrontMatter = async (postData: {
    title: string;
    tags: string[];
    categories: string[];
    excerpt?: string;
  }) => {
    try {
      const ipcRenderer = await getIpcRenderer();
      const postsDir = hexoPath + '/source/_posts';
      const fileName = postData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') + '.md';
      const filePath = `${postsDir}/${fileName}`;

      // 读取现有文件内容
      let content = await ipcRenderer.invoke('read-file', filePath);

      // 解析front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        let frontMatter = frontMatterMatch[1];

        // 添加标签
        if (postData.tags.length > 0) {
          // 检查是否已有tags字段
          const tagsMatch = frontMatter.match(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m);
          if (tagsMatch) {
            // 如果已有tags字段，替换它
            const tagsString = postData.tags.map(tag => `  - ${tag}`).join('\n');
            frontMatter = frontMatter.replace(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m, `tags:\n${tagsString}`);
          } else {
            // 如果没有tags字段，添加它
            const tagsString = postData.tags.map(tag => `  - ${tag}`).join('\n');
            frontMatter += `\ntags:\n${tagsString}`;
          }
        }

        // 添加分类
        if (postData.categories.length > 0) {
          const categoriesString = postData.categories.map(cat => `  - ${cat}`).join('\n');
          frontMatter += `\ncategories:\n${categoriesString}`;
        }

        // 添加摘要
        if (postData.excerpt) {
          frontMatter += `\nexcerpt: "${postData.excerpt}"`;
        }

        // 重新构建文件内容
        const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontMatter}\n---`);

        // 写回文件
        await ipcRenderer.invoke('write-file', filePath, newContent);
        
        // 重新提取标签和分类
        await extractTagsAndCategories(posts);
      }
    } catch (error) {
      console.error('更新文章元数据失败:', error);
    }
  };

  // 选择文章
  const selectPost = async (post: Post) => {
    if (!isElectron) return;

    setSelectedPost(post);
    setIsLoading(true);

    try {
      const ipcRenderer = await getIpcRenderer();
      const content = await ipcRenderer.invoke('read-file', post.path);
      setPostContent(content);
    } catch (error) {
      console.error('读取文章失败:', error);
      const readErrorResult = {
        success: false,
        error: '读取文章失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'read post'
      };
      setCommandLogs(prev => [...prev, readErrorResult]);
      setCommandResult(readErrorResult);
    } finally {
      setIsLoading(false);
      // 选择文章后设置自动保存定时器
      setupAutoSaveTimer();
    }
  };

  // 保存文章
  const savePost = async () => {
    if (!isElectron || !selectedPost) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      await ipcRenderer.invoke('write-file', selectedPost.path, postContent);

      const saveResult = {
        success: true,
        stdout: '文章保存成功',
        timestamp: new Date().toLocaleString(),
        command: 'save post'
      };
      setCommandLogs(prev => [...prev, saveResult]);
      setCommandResult(saveResult);
      
      // 显示成功通知
      toast({
        title: t.success,
        description: t.articleSaveSuccess,
        variant: 'success',
      });
      
      // 如果是服务器预览模式，触发预览框强制刷新
      if (previewMode === 'server' && editorMode === 'mode2') {
        setForcePreviewRefresh(true);
      }
      
      // 保存后重新提取标签和分类
      await extractTagsAndCategories(posts);
    } catch (error) {
      console.error('保存文章失败:', error);
      const saveErrorResult = {
        success: false,
        error: '保存文章失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'save post'
      };
      setCommandLogs(prev => [...prev, saveErrorResult]);
      setCommandResult(saveErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: t.saveArticleFailedMsg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
      // 保存文章后重置自动保存定时器
      setupAutoSaveTimer();
    }
  };

  // 删除文章
  const deletePost = async () => {
    if (!isElectron || !selectedPost) return;



    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      await ipcRenderer.invoke('delete-file', selectedPost.path);

      const deleteResult = {
        success: true,
        stdout: '文章删除成功',
        timestamp: new Date().toLocaleString(),
        command: 'delete post'
      };
      setCommandLogs(prev => [...prev, deleteResult]);
      setCommandResult(deleteResult);

      setSelectedPost(null);
      setPostContent('');
      await loadPosts(hexoPath);
      
      // 显示成功通知
      toast({
        title: t.success,
        description: t.articleDeleteSuccess,
        variant: 'success',
      });
    } catch (error) {
      console.error('删除文章失败:', error);
      const deleteErrorResult = {
        success: false,
        error: '删除文章失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'delete post'
      };
      setCommandLogs(prev => [...prev, deleteErrorResult]);
      setCommandResult(deleteErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: '文章删除失败',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 批量删除文章
  const deletePosts = async (postsToDelete: Post[]) => {
    if (!isElectron || postsToDelete.length === 0) return;

    if (!confirm(`确定要删除选中的 ${postsToDelete.length} 篇文章吗？此操作不可撤销。`)) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();

      // 逐个删除文章
      for (const post of postsToDelete) {
        await ipcRenderer.invoke('delete-file', post.path);
      }

      const batchDeleteResult = {
        success: true,
        stdout: `成功删除 ${postsToDelete.length} 篇文章`,
        timestamp: new Date().toLocaleString(),
        command: 'batch delete posts'
      };
      setCommandLogs(prev => [...prev, batchDeleteResult]);
      setCommandResult(batchDeleteResult);

      // 如果当前选中的文章在被删除的文章中，清空选择
      if (selectedPost && postsToDelete.some(p => p.path === selectedPost.path)) {
        setSelectedPost(null);
        setPostContent('');
      }

      await loadPosts(hexoPath);
      
      // 显示成功通知
      toast({
        title: t.success,
        description: t.articlesDeleteSuccess.replace('{count}', postsToDelete.length.toString()),
        variant: 'success',
      });
    } catch (error) {
      console.error('批量删除文章失败:', error);
      const batchDeleteErrorResult = {
        success: false,
        error: '批量删除文章失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'batch delete posts'
      };
      setCommandLogs(prev => [...prev, batchDeleteErrorResult]);
      setCommandResult(batchDeleteErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: '批量删除文章失败',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 批量添加标签到文章
  const addTagsToPosts = async (postsToUpdate: Post[], tags: string[]) => {
    if (!isElectron || postsToUpdate.length === 0 || tags.length === 0) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      let successCount = 0;

      // 逐个更新文章
      for (const post of postsToUpdate) {
        try {
          // 读取现有文件内容
          let content = await ipcRenderer.invoke('read-file', post.path);

          // 解析front matter
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            let frontMatter = frontMatterMatch[1];

            // 检查是否已有tags字段
            const tagsMatch = frontMatter.match(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m);

            if (tagsMatch) {
              // 已有tags字段，添加新标签
              const existingTags = tagsMatch[1].split('\n')
                .map(line => line.trim().replace(/^-\s*/, ''))
                .filter(tag => tag);

              // 合并标签，去重
              const allTags = [...new Set([...existingTags, ...tags])];
              const tagsString = allTags.map(tag => `  - ${tag}`).join('\n');

              // 替换原有tags字段
              frontMatter = frontMatter.replace(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m, `tags:\n${tagsString}`);
            } else {
              // 没有tags字段，添加新字段
              const tagsString = tags.map(tag => `  - ${tag}`).join('\n');
              frontMatter += `\\ntags:\\n${tagsString}`;
            }

            // 重新构建文件内容
const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontMatter}\n---`);
            // 写回文件
            await ipcRenderer.invoke('write-file', post.path, newContent);
            successCount++;
          }
        } catch (error) {
          console.error(`更新文章 ${post.name} 失败:`, error);
        }
      }

      const batchTagResult = {
        success: true,
        stdout: t.tagsAddSuccess.replace('{successCount}', successCount.toString()).replace('{totalCount}', postsToUpdate.length.toString()),
        timestamp: new Date().toLocaleString(),
        command: 'batch add tags'
      };
      setCommandLogs(prev => [...prev, batchTagResult]);
      setCommandResult(batchTagResult);

      // 如果当前选中的文章在被更新的文章中，重新加载内容
      if (selectedPost && postsToUpdate.some(p => p.path === selectedPost.path)) {
        const content = await ipcRenderer.invoke('read-file', selectedPost.path);
        setPostContent(content);
      }
      
      // 重新提取标签和分类
      await extractTagsAndCategories(posts);
    } catch (error) {
      console.error('批量添加标签失败:', error);
      const batchTagErrorResult = {
        success: false,
        error: '批量添加标签失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'batch add tags'
      };
      setCommandLogs(prev => [...prev, batchTagErrorResult]);
      setCommandResult(batchTagErrorResult);
    } finally {
      setIsLoading(false);
    }
  };

  // 批量添加分类到文章
  const addCategoriesToPosts = async (postsToUpdate: Post[], categories: string[]) => {
    if (!isElectron || postsToUpdate.length === 0 || categories.length === 0) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      let successCount = 0;

      // 逐个更新文章
      for (const post of postsToUpdate) {
        try {
          // 读取现有文件内容
          let content = await ipcRenderer.invoke('read-file', post.path);

          // 解析front matter
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            let frontMatter = frontMatterMatch[1];

            // 检查是否已有categories字段
            const categoriesMatch = frontMatter.match(/^categories:\s*([\s\S]*?)(?=\n\w|\n*$)/m);

            if (categoriesMatch) {
              // 已有categories字段，添加新分类
              const existingCategories = categoriesMatch[1].split('\n')
                .map(line => line.trim().replace(/^-\s*/, ''))
                .filter(cat => cat);

              // 合并分类，去重
              const allCategories = [...new Set([...existingCategories, ...categories])];
              const categoriesString = allCategories.map(cat => `  - ${cat}`).join('\n');

              // 替换原有categories字段
              frontMatter = frontMatter.replace(/^categories:\s*([\s\S]*?)(?=\n\w|\n*$)/m, `categories:\n${categoriesString}`);
            } else {
              // 没有categories字段，添加新字段
              const categoriesString = categories.map(cat => `  - ${cat}`).join('\n');
              frontMatter += `\ncategories:\n${categoriesString}`;
            }

            // 重新构建文件内容
const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontMatter}\n---`);


            // 写回文件
            await ipcRenderer.invoke('write-file', post.path, newContent);
            successCount++;
          }
        } catch (error) {
          console.error(`更新文章 ${post.name} 失败:`, error);
        }
      }

      setCommandResult({
        success: true,
        stdout: t.categoriesAddSuccess.replace('{successCount}', successCount.toString()).replace('{totalCount}', postsToUpdate.length.toString())
      });

      // 如果当前选中的文章在被更新的文章中，重新加载内容
      if (selectedPost && postsToUpdate.some(p => p.path === selectedPost.path)) {
        const content = await ipcRenderer.invoke('read-file', selectedPost.path);
        setPostContent(content);
      }
      
      // 重新提取标签和分类
      await extractTagsAndCategories(posts);
    } catch (error) {
      console.error('批量添加分类失败:', error);
      const batchCategoryErrorResult = {
        success: false,
        error: '批量添加分类失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'batch add categories'
      };
      setCommandLogs(prev => [...prev, batchCategoryErrorResult]);
      setCommandResult(batchCategoryErrorResult);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除单篇文章
  const deleteSinglePost = async (postToDelete: Post) => {
    if (!isElectron || !postToDelete) return;



    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      await ipcRenderer.invoke('delete-file', postToDelete.path);

      const deleteSingleResult = {
        success: true,
        stdout: '文章删除成功',
        timestamp: new Date().toLocaleString(),
        command: 'delete single post'
      };
      setCommandLogs(prev => [...prev, deleteSingleResult]);
      setCommandResult(deleteSingleResult);

      // 如果删除的是当前选中的文章，清空选择
      if (selectedPost && selectedPost.path === postToDelete.path) {
        setSelectedPost(null);
        setPostContent('');
      }
      
      await loadPosts(hexoPath);
      
      // 显示成功通知
      toast({
        title: t.success,
        description: t.articleDeleteSuccess,
        variant: 'success',
      });
    } catch (error) {
      console.error('删除文章失败:', error);
      const deleteErrorResult = {
        success: false,
        error: '删除文章失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'delete post'
      };
      setCommandLogs(prev => [...prev, deleteErrorResult]);
      setCommandResult(deleteErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: '删除文章失败',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 为单篇文章添加标签
  const addTagsToPost = async (postToUpdate: Post, tags: string[]) => {
    if (!isElectron || !postToUpdate || tags.length === 0) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      
      // 读取现有文件内容
      let content = await ipcRenderer.invoke('read-file', postToUpdate.path);

      // 解析front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        let frontMatter = frontMatterMatch[1];

        // 检查是否已有tags字段
        const tagsMatch = frontMatter.match(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m);
        
        if (tagsMatch) {
          // 已有tags字段，添加新标签
          const existingTags = tagsMatch[1].split('\n')
            .map(line => line.trim().replace(/^\-\s*/, ''))
            .filter(tag => tag);
          
          // 合并标签，去重
          const allTags = [...new Set([...existingTags, ...tags])];
          const tagsString = allTags.map(tag => `  - ${tag}`).join('\n');
          
          // 替换原有tags字段
          frontMatter = frontMatter.replace(/^tags:\s*([\s\S]*?)(?=\n\w|\n*$)/m, `tags:\n${tagsString}`);
        } else {
          // 没有tags字段，添加新字段
          const tagsString = tags.map(tag => `  - ${tag}`).join('\n');
          frontMatter += `\ntags:\n${tagsString}`;
        }

        // 重新构建文件内容
        const newContent = content.replace(/^---\n([\s\S]*?)\n---/, `---\n${frontMatter}\n---`);

        // 写回文件
        await ipcRenderer.invoke('write-file', postToUpdate.path, newContent);

        const addTagResult = {
          success: true,
          stdout: '标签添加成功',
          timestamp: new Date().toLocaleString(),
          command: 'add tags'
        };
        setCommandLogs(prev => [...prev, addTagResult]);
        setCommandResult(addTagResult);

        // 如果更新的是当前选中的文章，重新加载内容
        if (selectedPost && selectedPost.path === postToUpdate.path) {
          const content = await ipcRenderer.invoke('read-file', selectedPost.path);
          setPostContent(content);
        }
        
        // 重新提取标签和分类
        await extractTagsAndCategories(posts);
      }
    } catch (error) {
      console.error('添加标签失败:', error);
      setCommandResult({
        success: false,
        error: '添加标签失败: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 为单篇文章添加分类
  const addCategoriesToPost = async (postToUpdate: Post, categories: string[]) => {
    if (!isElectron || !postToUpdate || categories.length === 0) return;

    setIsLoading(true);
    try {
      const ipcRenderer = await getIpcRenderer();
      
      // 读取现有文件内容
      let content = await ipcRenderer.invoke('read-file', postToUpdate.path);

      // 解析front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        let frontMatter = frontMatterMatch[1];

        // 检查是否已有categories字段
        const categoriesMatch = frontMatter.match(/^categories:\s*([\s\S]*?)(?=\n\w|\n*$)/m);
        
        if (categoriesMatch) {
          // 已有categories字段，添加新分类
          const existingCategories = categoriesMatch[1].split('\n')
            .map(line => line.trim().replace(/^\-\s*/, ''))
            .filter(cat => cat);
          
          // 合并分类，去重
          const allCategories = [...new Set([...existingCategories, ...categories])];
          const categoriesString = allCategories.map(cat => `  - ${cat}`).join('\n');
          
          // 替换原有categories字段
          frontMatter = frontMatter.replace(/^categories:\s*([\s\S]*?)(?=\n\w|\n*$)/m, `categories:\n${categoriesString}`);
        } else {
          // 没有categories字段，添加新字段
          const categoriesString = categories.map(cat => `  - ${cat}`).join('\n');
          frontMatter += `\ncategories:\n${categoriesString}`;
        }

        // 重新构建文件内容
        const newContent = content.replace(/^---\n([\s\S]*?)\n---/, `---\n${frontMatter}\n---`);

        // 写回文件
        await ipcRenderer.invoke('write-file', postToUpdate.path, newContent);

        const addCategoryResult = {
          success: true,
          stdout: '分类添加成功',
          timestamp: new Date().toLocaleString(),
          command: 'add categories'
        };
        setCommandLogs(prev => [...prev, addCategoryResult]);
        setCommandResult(addCategoryResult);

        // 如果更新的是当前选中的文章，重新加载内容
        if (selectedPost && selectedPost.path === postToUpdate.path) {
          const content = await ipcRenderer.invoke('read-file', selectedPost.path);
          setPostContent(content);
        }
        
        // 重新提取标签和分类
        await extractTagsAndCategories(posts);
      }
    } catch (error) {
      console.error('添加分类失败:', error);
      setCommandResult({
        success: false,
        error: '添加分类失败: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 执行Hexo命令
  const executeHexoCommand = async (command: string, useCustomExecutor?: boolean) => {
    if (!isElectron || !hexoPath) return;

    setIsLoading(true);
    
    // 显示开始执行命令的提示
    let commandName = '';
    if (command === 'clean') commandName = '清理缓存';
    else if (command === 'generate') commandName = '生成静态文件';
    else if (command === 'deploy') commandName = '部署网站';
    else commandName = `执行命令: ${command}`;
    
    // 显示开始执行的通知
    toast({
      title: t.executing,
      description: t.commandExecuting.replace('{command}', commandName),
      variant: 'default',
    });

    try {
      const ipcRenderer = await getIpcRenderer();
      const result = useCustomExecutor
        ? await ipcRenderer.invoke('execute-custom-command', command, hexoPath)
        : await ipcRenderer.invoke('execute-hexo-command', command, hexoPath);

      // 添加到日志
      const newLog = {
        ...result,
        timestamp: new Date().toLocaleString(),
        command: command
      };
      setCommandLogs(prev => [...prev, newLog]);
      setCommandResult(result);
      
      // 显示通知
      if (result.success) {
        let message = t.commandExecuteSuccess;
        if (command === 'clean') message = t.cleanCacheSuccess;
        else if (command === 'generate') {
          toast({
            title: t.success,
            description: (
              <div className="flex items-center justify-between">
                <span>{t.generateStaticFilesSuccess}</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={async (e) => {
                    e.preventDefault();
                    
                    // 显示加载提示
                    const loadingToast = toast({
                      title: language === 'zh' ? '正在打开...' : 'Opening...',
                      description: language === 'zh' ? '正在打开文件夹' : 'Opening folder',
                      duration: 2000,
                    });
                    
                    try {
                      if (typeof window !== 'undefined' && ('require' in window || '__TAURI__' in window || '__TAURI_INTERNALS__' in window)) {
                        // 使用 normalizePathInternal 拼接路径，避免混合分隔符
                        const publicPath = normalizePathInternal(`${hexoPath}/public`);
                        console.log('[Open Folder] Attempting to open:', publicPath);
                        console.log('[Open Folder] Desktop environment:', isDesktopApp());
                        const ipcRenderer = await getIpcRenderer();
                        await ipcRenderer.invoke('open-url', publicPath);
                        console.log('[Open Folder] Successfully opened');
                        
                        // 成功提示
                        toast({
                          title: t.success,
                          description: language === 'zh' ? '文件夹已打开' : 'Folder opened',
                          variant: 'success',
                          duration: 1500,
                        });
                      } else {
                        console.log('[Open Folder] Not in desktop environment');
                        toast({
                          title: t.error,
                          description: language === 'zh' ? '仅在桌面应用中可用' : 'Only available in desktop app',
                          variant: 'error',
                        });
                      }
                    } catch (error) {
                      console.error('[Open Folder] Failed:', error);
                      toast({
                        title: t.error,
                        description: language === 'zh' ? `打开文件夹失败: ${error}` : `Failed to open folder: ${error}`,
                        variant: 'error',
                      });
                    }
                  }}
                >
                  [打开]
                </Button>
              </div>
            ),
            variant: 'success',
          });
        } else if (command === 'deploy') message = t.deploySuccess;
        
        // 对于generate命令，已经在上面显示了自定义通知，这里不再显示
        if (command !== 'generate') {
          toast({
            title: t.success,
            description: message,
            variant: 'success',
          });
        }
      } else {
        let message = t.commandExecuteFailed;
        if (command === 'clean') message = t.clean + t.error;
        else if (command === 'generate') message = t.generate + t.error;
        else if (command === 'deploy') message = t.deploy + t.error;
        
        // 提取详细错误信息
        let detailError = '';
        let fixCommand = ''; // 用于存储修复命令
        if (result.stderr) {
          // 尝试提取关键错误信息
          const stderr = result.stderr;
          
          // 检查是否是 git safe.directory 错误
          if (stderr.includes('dubious ownership') || stderr.includes('safe.directory')) {
            const match = stderr.match(/git config --global --add safe\.directory (.+)/);
            if (match) {
              detailError = `${t.gitSecurityError}：${t.gitSecurityErrorTrustDir}\n${t.gitSecurityErrorSuggest}：${match[0]}`;
              fixCommand = match[0]; // 保存修复命令
            } else {
              detailError = `${t.gitSecurityError}：${t.gitSecurityErrorOwnership}`;
            }
          } 
          // 检查是否是 git 认证错误
          else if (stderr.includes('Permission denied') || stderr.includes('authentication failed')) {
            detailError = t.gitAuthError;
          }
          // 检查是否是网络错误
          else if (stderr.includes('Could not resolve host') || stderr.includes('network')) {
            detailError = t.networkError;
          }
          // 其他错误，提取 FATAL 或 fatal 后的内容
          else if (stderr.includes('FATAL') || stderr.includes('fatal:')) {
            const fatalMatch = stderr.match(/fatal:\s*(.+?)(?:\n|$)/i);
            if (fatalMatch) {
              detailError = fatalMatch[1].trim();
            }
          }
          
          // 如果没有提取到特定错误，显示 stderr 的前 200 个字符
          if (!detailError && stderr.trim()) {
            // 移除 ANSI 颜色代码
            const cleanStderr = stderr.replace(/\u001b\[[0-9;]*m/g, '');
            detailError = cleanStderr.substring(0, 200).trim();
            if (cleanStderr.length > 200) detailError += '...';
          }
        }
        
        // 如果有详细错误，显示在描述中
        const errorMessage = detailError ? `${message}\n\n${detailError}` : message;
        
        toast({
          title: t.failed,
          description: (
            <div className="max-w-md">
              <div className="font-medium mb-2">{message}</div>
              {detailError && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded whitespace-pre-wrap font-mono">
                  {detailError}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                {fixCommand && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-3"
                    onClick={async () => {
                      try {
                        toast({
                          title: t.fixing,
                          description: fixCommand,
                          variant: 'default',
                        });
                        
                        const ipcRenderer = await getIpcRenderer();
                        const fixResult = await ipcRenderer.invoke('execute-command', fixCommand);
                        
                        // 添加到日志
                        const fixLog = {
                          ...fixResult,
                          timestamp: new Date().toLocaleString(),
                          command: `${t.autoFix}: ${fixCommand}`
                        };
                        setCommandLogs(prev => [...prev, fixLog]);
                        
                        if (fixResult.success) {
                          toast({
                            title: t.fixSuccess,
                            description: t.fixSuccessRetry,
                            variant: 'success',
                          });
                        } else {
                          toast({
                            title: t.fixFailed,
                            description: fixResult.error || fixResult.stderr,
                            variant: 'error',
                          });
                        }
                      } catch (error) {
                        // 添加错误日志
                        const fixErrorLog = {
                          success: false,
                          error: error instanceof Error ? error.message : String(error),
                          timestamp: new Date().toLocaleString(),
                          command: `${t.autoFix}: ${fixCommand}`
                        };
                        setCommandLogs(prev => [...prev, fixErrorLog]);
                        
                        toast({
                          title: t.fixFailed,
                          description: error instanceof Error ? error.message : String(error),
                          variant: 'error',
                        });
                      }
                    }}
                  >
                    {t.tryFix}
                  </Button>
                )}
                <div 
                  className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                  onClick={() => {
                    setMainView('logs');
                  }}
                >
                  {t.viewLogsDetail}
                </div>
              </div>
            </div>
          ),
          variant: 'error',
          duration: 10000, // 错误提示显示 10 秒，给用户足够时间阅读
        });
      }
    } catch (error) {
      console.error('执行命令失败:', error);
      const commandErrorResult = {
        success: false,
        error: '执行命令失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: command
      };
      setCommandLogs(prev => [...prev, commandErrorResult]);
      setCommandResult(commandErrorResult);
      
      // 显示错误通知
      toast({
        title: t.failed,
        description: '执行命令失败',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 启动Hexo服务器
  // 注意：Tauri 后端已经通过监听 Hexo 输出判断启动状态
  // 后端会在检测到 "Hexo is running at" 等标志后才返回成功
  const startHexoServer = async () => {
    if (!isElectron || !hexoPath || isServerRunning) return;

    setIsLoading(true);

    // 显示开始启动服务器的通知
    toast({
      title: t.starting,
      description: t.startingServer,
      variant: 'default',
    });

    // 端口冲突检测
    const isPortConflict = (r: any) => !!(r?.error && (
      r.error.includes('端口 4000 已被占用') ||
      r.error.includes('Port 4000 has been used') ||
      r.error.includes('EADDRINUSE') ||
      r.error.includes('地址已经被使用')
    ));

    // 内部启动逻辑（可重试）
    const doStart = async () => {
      const ipcRenderer = await getIpcRenderer();
      const serverCustomCmd = enableCustomCommands ? customServerCommand : undefined;
      return await ipcRenderer.invoke('start-hexo-server', hexoPath, serverCustomCmd);
    };

    try {
      let result = await doStart();

      // 端口冲突时，自动清理后重试一次
      if (!result.success && isPortConflict(result)) {
        toast({
          title: t.starting,
          description: '检测到端口 4000 被占用，正在自动清理并重试...',
          variant: 'default',
        });
        try {
          const ipcRenderer = await getIpcRenderer();
          // 先停止服务器（清理后端 hexoServerProcess + 端口残留）
          await ipcRenderer.invoke('stop-hexo-server');
          // 再修复端口（兜底）
          await ipcRenderer.invoke('fix-port-conflict', 4000);
        } catch (e) {
          // 忽略清理错误，继续重试
        }
        // 重试启动
        result = await doStart();
      }

      if (result.success) {
        setServerProcess(result.process);
        setIsServerRunning(true);

        const serverStartResult = {
          success: true,
          stdout: result.stdout || 'Hexo服务器已启动，访问 http://localhost:4000 预览网站',
          timestamp: new Date().toLocaleString(),
          command: 'start server'
        };
        setCommandLogs(prev => [...prev, serverStartResult]);
        setCommandResult(serverStartResult);

        // 显示成功通知
        toast({
          title: t.success,
          description: t.serverRunning,
          variant: 'success',
        });

        // 只有在非服务器预览模式下才打开浏览器预览
        if (previewMode !== 'server') {
          setTimeout(() => {
            getIpcRenderer()
              .then(ipc => ipc.invoke('open-url', 'http://localhost:4000'))
              .catch(() => { /* 忽略打开浏览器失败 */ });
          }, 1000);
        }
      } else {
        setCommandResult(result);

        if (isPortConflict(result)) {
          // 自动重试后仍端口冲突 - 显示带修复按钮的提示
          toast({
            title: t.failed,
            description: result.error || '端口 4000 已被占用',
            variant: 'error',
            action: (
              <ToastAction
                altText="立即修复"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const ipcRenderer = await getIpcRenderer();
                    const fixResult = await ipcRenderer.invoke('fix-port-conflict', 4000);

                    if (fixResult.success) {
                      toast({
                        title: '✅ 修复成功',
                        description: fixResult.stdout || '端口已释放，请重新启动服务器',
                        variant: 'success',
                      });
                    } else {
                      toast({
                        title: '修复失败',
                        description: fixResult.error || '无法自动修复端口占用',
                        variant: 'error',
                      });
                    }
                  } catch (error) {
                    toast({
                      title: '修复失败',
                      description: error instanceof Error ? error.message : '发生错误',
                      variant: 'error',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                立即修复
              </ToastAction>
            ),
          });
        } else {
          // 其他错误 - 普通提示
          toast({
            title: t.failed,
            description: result.error || 'Hexo服务器启动失败',
            variant: 'error',
          });
        }
      }
    } catch (error) {
      console.error('启动服务器失败:', error);
      setCommandResult({
        success: false,
        error: '启动服务器失败: ' + (error instanceof Error ? error.message : String(error))
      });

      // 显示错误通知
      toast({
        title: t.failed,
        description: '启动服务器失败',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 推送核心逻辑（不含 toast / isLoading 管理），供 pushToRemote 和 oneClickPublish 复用
  // 所有用户输入通过 escapeShellArg 转义，防止命令注入
  const pushToRemoteCore = async (): Promise<{
    success: boolean;
    error?: string;
    logs: Array<{ success: boolean; stdout?: string; stderr?: string; error?: string; timestamp: string; command: string }>;
  }> => {
    const logs: Array<{ success: boolean; stdout?: string; stderr?: string; error?: string; timestamp: string; command: string }> = [];

    if (!pushRepoUrl || !pushUsername || !pushEmail) {
      return { success: false, error: '请先在面板设置中配置推送信息', logs };
    }

    const ipcRenderer = await getIpcRenderer();

    // 转义所有用户输入，防止命令注入
    const escapedHexoPath = escapeShellArg(hexoPath);
    const escapedUsername = escapeShellArg(pushUsername);
    const escapedEmail = escapeShellArg(pushEmail);
    const escapedRepoUrl = escapeShellArg(pushRepoUrl);
    const escapedBranch = escapeShellArg(pushBranch);

    // commit message 带时间戳，避免多次推送无法区分
    const commitMessage = `${t.commitMessagePrefix} - ${new Date().toLocaleString()}`;
    const escapedCommitMessage = escapeShellArg(commitMessage);

    const gitSteps = [
      { cmd: `git -C ${escapedHexoPath} config user.name ${escapedUsername}`, log: 'git config user.name', name: '配置用户名' },
      { cmd: `git -C ${escapedHexoPath} config user.email ${escapedEmail}`, log: 'git config user.email', name: '配置邮箱' },
      { cmd: `git -C ${escapedHexoPath} remote set-url origin ${escapedRepoUrl}`, log: 'git remote set-url origin', name: '设置远程仓库' },
      { cmd: `git -C ${escapedHexoPath} add .`, log: 'git add .', name: '添加文件' },
      { cmd: `git -C ${escapedHexoPath} commit -m ${escapedCommitMessage}`, log: `git commit -m "${commitMessage}"`, name: '提交更改' },
      { cmd: `git -C ${escapedHexoPath} push -u origin ${escapedBranch}`, log: `git push -u origin ${pushBranch}`, name: '推送到远程' },
    ];

    for (const gitStep of gitSteps) {
      const r = await ipcRenderer.invoke('execute-command', gitStep.cmd);
      logs.push({ ...r, timestamp: new Date().toLocaleString(), command: gitStep.log });

      if (!r.success) {
        // 容忍 git commit 无改动：英文 "nothing to commit" 或中文 "无文件要提交" / "没有要提交的内容"
        const isCommitNothingToCommit = gitStep.log.startsWith('git commit') && (
          r.stderr?.includes('nothing to commit') ||
          r.stdout?.includes('nothing to commit') ||
          r.stderr?.includes('无文件要提交') ||
          r.stdout?.includes('无文件要提交') ||
          r.stderr?.includes('没有要提交的') ||
          r.stdout?.includes('没有要提交的')
        );

        // git push 即使 success: false，也可能实际推送成功（PowerShell stderr 误判）
        // 检测成功标志：输出包含 "分支名 -> 分支名" 或 "Everything up-to-date"
        const combinedOutput = (r.stdout || '') + (r.stderr || '');
        const isPushActuallySuccess = gitStep.log.startsWith('git push') && (
          combinedOutput.includes('->') ||                    // 如 "main -> main"
          combinedOutput.includes('Everything up-to-date') ||
          combinedOutput.includes('已是最新') ||
          combinedOutput.includes('set up to track')
        );

        if (isCommitNothingToCommit || isPushActuallySuccess) {
          // 非致命情况，继续执行下一步
          continue;
        }

        // git push 因远程有新提交被拒绝（non-fast-forward）
        // 场景：一键发布中 hexo deploy 已推送 .deploy_git 到远程，源仓库 push 时冲突
        // 修复：自动 git pull --rebase 后重试 push 一次
        const isPushNonFastForward = gitStep.log.startsWith('git push') && (
          combinedOutput.includes('fetch first') ||
          combinedOutput.includes('rejected') ||
          combinedOutput.includes('non-fast-forward') ||
          combinedOutput.includes('强制更新')
        );

        if (isPushNonFastForward) {
          // 步骤 1: git pull --rebase origin <branch>
          const pullCmd = `git -C ${escapedHexoPath} pull --rebase origin ${escapedBranch}`;
          const pullResult = await ipcRenderer.invoke('execute-command', pullCmd);
          logs.push({ ...pullResult, timestamp: new Date().toLocaleString(), command: `git pull --rebase origin ${pushBranch}` });

          if (pullResult.success) {
            // 步骤 2: 重试 git push
            const retryResult = await ipcRenderer.invoke('execute-command', gitStep.cmd);
            logs.push({ ...retryResult, timestamp: new Date().toLocaleString(), command: `${gitStep.log} (重试)` });

            if (retryResult.success) {
              continue;  // 重试成功，继续（已是最后一步，循环结束）
            }

            // 重试仍失败，检测是否实际成功
            const retryCombined = (retryResult.stdout || '') + (retryResult.stderr || '');
            const retryActuallySuccess = retryCombined.includes('->') ||
              retryCombined.includes('Everything up-to-date') ||
              retryCombined.includes('已是最新');

            if (retryActuallySuccess) {
              continue;
            }

            return {
              success: false,
              error: `[${gitStep.name}] pull --rebase 后重试仍失败: ${retryResult.stderr || retryResult.error || 'unknown error'}`,
              logs,
            };
          }

          // pull --rebase 失败（可能有冲突），返回错误
          return {
            success: false,
            error: `[${gitStep.name}] 远程有新提交，git pull --rebase 失败: ${pullResult.stderr || pullResult.error || '可能存在冲突，请手动解决'}`,
            logs,
          };
        }

        // 真正失败，返回包含步骤名的错误信息
        return {
          success: false,
          error: `[${gitStep.name}] ${r.stderr || r.error || 'unknown error'}`,
          logs,
        };
      }
    }

    return { success: true, logs };
  };

  // 推送项目到远程仓库
  const pushToRemote = async () => {
    if (!isElectron || !hexoPath) return;

    // 检查推送设置是否完整
    if (!pushRepoUrl || !pushUsername || !pushEmail) {
      toast({
        title: '错误',
        description: '请先在面板设置中配置推送信息',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    // 显示开始推送的通知
    toast({
      title: t.pushing,
      description: '正在将项目推送到远程仓库...',
      variant: 'default',
    });

    try {
      const result = await pushToRemoteCore();

      // 写入日志
      for (const log of result.logs) {
        setCommandLogs(prev => [...prev, log]);
      }

      if (result.success) {
        const pushSuccessResult = {
          success: true,
          stdout: '项目已成功推送到远程仓库',
          timestamp: new Date().toLocaleString(),
          command: 'push to remote',
        };
        setCommandLogs(prev => [...prev, pushSuccessResult]);
        setCommandResult(pushSuccessResult);

        toast({
          title: t.success,
          description: t.pushSuccess,
          variant: 'success',
        });
      } else {
        const failResult = {
          success: false,
          error: result.error,
          timestamp: new Date().toLocaleString(),
          command: 'push to remote',
        };
        setCommandResult(failResult);

        // 显示包含失败步骤名的错误信息（result.error 格式为 "[步骤名] 详情"）
        toast({
          title: t.failed,
          description: result.error || t.pushFailed,
          variant: 'error',
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('推送失败:', error);
      const pushErrorResult = {
        success: false,
        error: '推送失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'push to remote',
      };
      setCommandLogs(prev => [...prev, pushErrorResult]);
      setCommandResult(pushErrorResult);

      // 显示错误通知
      toast({
        title: t.failed,
        description: t.pushFailed,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 一键发布：顺序执行 清理 → 生成 → 部署 → 推送（如启用且配置完整）
  const oneClickPublish = async () => {
    if (!isElectron || !hexoPath) return;

    setIsLoading(true);

    // 模板字符串一次性替换（避免 replace 链相互干扰）
    const fmt = (template: string, vars: Record<string, string | number>) =>
      template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

    // Hexo 命令步骤
    const hexoSteps = [
      { command: enableCustomCommands ? customCleanCommand : 'clean', useCustom: enableCustomCommands, name: t.clean },
      { command: enableCustomCommands ? customGenerateCommand : 'generate', useCustom: enableCustomCommands, name: t.generate },
      { command: enableCustomCommands ? customDeployCommand : 'deploy', useCustom: enableCustomCommands, name: t.deploy },
    ];

    // 推送步骤是否可用
    const willPush = enablePush && !!(pushRepoUrl && pushUsername && pushEmail);
    const totalSteps = willPush ? hexoSteps.length + 1 : hexoSteps.length;

    toast({
      title: t.oneClickPublish,
      description: t.oneClickPublishStart,
      variant: 'default',
    });

    try {
      const ipcRenderer = await getIpcRenderer();

      // 执行 Hexo 命令步骤
      for (let i = 0; i < hexoSteps.length; i++) {
        const step = hexoSteps[i];
        const stepNum = i + 1;

        toast({
          title: t.executing,
          description: fmt(t.oneClickPublishStep, { step: stepNum, total: totalSteps, command: step.name }),
          variant: 'default',
        });

        const result = step.useCustom
          ? await ipcRenderer.invoke('execute-custom-command', step.command, hexoPath)
          : await ipcRenderer.invoke('execute-hexo-command', step.command, hexoPath);

        setCommandLogs(prev => [...prev, { ...result, timestamp: new Date().toLocaleString(), command: step.command }]);
        setCommandResult(result);

        if (!result.success) {
          toast({
            title: t.failed,
            description: fmt(t.oneClickPublishFailed, { step: stepNum, command: step.name }),
            variant: 'error',
            duration: 10000,
          });
          return;
        }
      }

      // 推送步骤
      if (enablePush) {
        if (!willPush) {
          // 推送已启用但配置不完整，跳过并提示
          toast({
            title: t.oneClickPublish,
            description: t.oneClickPublishPushSkipped,
            variant: 'default',
          });
        } else {
          const stepNum = hexoSteps.length + 1;
          toast({
            title: t.executing,
            description: fmt(t.oneClickPublishStep, { step: stepNum, total: totalSteps, command: t.push }),
            variant: 'default',
          });

          // 复用 pushToRemoteCore（含输入转义、commit 时间戳、容错等）
          const pushResult = await pushToRemoteCore();
          for (const log of pushResult.logs) {
            setCommandLogs(prev => [...prev, log]);
          }

          if (!pushResult.success) {
            const failResult = {
              success: false,
              error: pushResult.error,
              timestamp: new Date().toLocaleString(),
              command: 'push to remote',
            };
            setCommandResult(failResult);
            toast({
              title: t.failed,
              description: fmt(t.oneClickPublishFailed, { step: stepNum, command: t.push }),
              variant: 'error',
              duration: 10000,
            });
            return;
          }

          const pushSuccessResult = {
            success: true,
            stdout: '项目已成功推送到远程仓库',
            timestamp: new Date().toLocaleString(),
            command: 'push to remote',
          };
          setCommandLogs(prev => [...prev, pushSuccessResult]);
          setCommandResult(pushSuccessResult);
        }
      }

      toast({
        title: t.success,
        description: t.oneClickPublishSuccess,
        variant: 'success',
      });
    } catch (error) {
      console.error('一键发布失败:', error);
      const errResult = {
        success: false,
        error: '一键发布失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'one-click publish',
      };
      setCommandLogs(prev => [...prev, errResult]);
      setCommandResult(errResult);
      toast({
        title: t.failed,
        description: errResult.error,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 停止Hexo服务器
  const stopHexoServer = async () => {
    if (!isElectron || !isServerRunning) return;

    setIsLoading(true);

    // 显示开始停止服务器的通知
    toast({
      title: t.stopping,
      description: t.stoppingServer,
      variant: 'default',
    });

    try {
      let result;

      // 判断是否在 Tauri 环境，使用对应的 API
      if (isTauri()) {
        // Tauri 环境：使用公共的 commandOperations
        result = await commandOperations.stopHexoServer();
      } else {
        // Electron 环境：使用 IPC
        const ipcRenderer = await getIpcRenderer();
        result = await ipcRenderer.invoke('stop-hexo-server');
      }

      // 无论后端返回 success 还是失败，前端都重置状态
      // 这样即使后端 hexoServerProcess 已丢失（应用重启场景），按钮也能切回"开启服务器"
      setIsServerRunning(false);
      setServerProcess(null);

      const serverStopResult = {
        success: true,
        stdout: result.stdout || 'Hexo服务器已停止',
        timestamp: new Date().toLocaleString(),
        command: 'stop server'
      };
      setCommandLogs(prev => [...prev, serverStopResult]);
      setCommandResult(serverStopResult);

      if (result.success) {
        toast({
          title: t.success,
          description: t.serverStopped,
          variant: 'success',
        });
      } else {
        // 后端返回失败（如"没有正在运行的服务器"），但前端状态已重置
        // 按钮切回"开启服务器"，用户可重新启动
        toast({
          title: t.success,
          description: result.error || '服务器状态已重置',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('停止服务器失败:', error);
      // 即使抛异常，也重置前端状态，避免按钮卡在"关闭服务器"
      setIsServerRunning(false);
      setServerProcess(null);
      const serverStopErrorResult = {
        success: false,
        error: '停止服务器失败: ' + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toLocaleString(),
        command: 'stop server'
      };
      setCommandLogs(prev => [...prev, serverStopErrorResult]);
      setCommandResult(serverStopErrorResult);

      toast({
        title: t.failed,
        description: '停止服务器失败，状态已重置',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const imageArticleOptions = React.useMemo(() => {
    return posts
      .map((post) => post.name.replace(/\.(md|markdown)$/i, ''))
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [posts]);

  const imageArticleTagCounts = React.useMemo(() => {
    return uploadedImages.reduce<Record<string, number>>((counts, image) => {
      const articleTitle = imageArticleTags[image.name] || '';
      if (articleTitle) {
        counts[articleTitle] = (counts[articleTitle] || 0) + 1;
      }
      return counts;
    }, {});
  }, [uploadedImages, imageArticleTags]);

  const usedImageArticleTags = React.useMemo(() => {
    return Object.keys(imageArticleTagCounts)
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [imageArticleTagCounts]);

  const untaggedImageCount = React.useMemo(() => {
    return uploadedImages.filter((image) => !imageArticleTags[image.name]).length;
  }, [uploadedImages, imageArticleTags]);

  const visibleUploadedImages = React.useMemo(() => {
    if (imageArticleFilter === 'all') return uploadedImages;
    if (imageArticleFilter === 'untagged') {
      return uploadedImages.filter((image) => !imageArticleTags[image.name]);
    }
    return uploadedImages.filter((image) => imageArticleTags[image.name] === imageArticleFilter);
  }, [uploadedImages, imageArticleTags, imageArticleFilter]);

  const selectedImageArticleFilterLabel = React.useMemo(() => {
    if (imageArticleFilter === 'all') return language === 'zh' ? '全部图片' : 'All images';
    if (imageArticleFilter === 'untagged') return language === 'zh' ? '未关联文章' : 'Untagged images';
    return imageArticleFilter;
  }, [imageArticleFilter, language]);

  const renderImageArticleFilterControls = () => (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        {language === 'zh' ? '按文章标签查看：' : 'View by post tag:'}
      </span>
      <Button
        variant={imageArticleFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setImageArticleFilter('all')}
      >
        {language === 'zh' ? `全部 ${uploadedImages.length}` : `All ${uploadedImages.length}`}
      </Button>
      <Button
        variant={imageArticleFilter === 'untagged' ? 'default' : 'outline'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setImageArticleFilter('untagged')}
      >
        {language === 'zh' ? `未关联 ${untaggedImageCount}` : `Untagged ${untaggedImageCount}`}
      </Button>
      {usedImageArticleTags.map((articleTitle) => (
        <Button
          key={articleTitle}
          variant={imageArticleFilter === articleTitle ? 'default' : 'outline'}
          size="sm"
          className="h-7 max-w-48 px-2 text-xs"
          onClick={() => setImageArticleFilter(articleTitle)}
          title={articleTitle}
        >
          <span className="truncate">{articleTitle}</span>
          <span className="ml-1 opacity-75">{imageArticleTagCounts[articleTitle]}</span>
        </Button>
      ))}
      {usedImageArticleTags.length === 0 && (
        <span className="text-xs text-muted-foreground">
          {language === 'zh' ? '还没有图片关联到文章' : 'No images are linked to posts yet'}
        </span>
      )}
    </div>
  );

  const renderImageArticleTagSelect = (image: UploadedImage, compact = false) => {
    const currentArticleTitle = getImageArticleTag(image.name);

    return (
      <select
        value={currentArticleTitle}
        onChange={(event) => updateImageArticleTag(image.name, event.target.value)}
        className={`${compact ? 'h-8 max-w-44 text-[11px]' : 'h-9 max-w-64 text-xs'} rounded-md border border-slate-300 bg-white px-2 font-medium text-slate-800 shadow-sm outline-none transition-colors hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:focus:border-blue-400`}
        title={language === 'zh' ? '选择使用该图片的文章' : 'Select the post using this image'}
      >
        <option className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100" value="">{language === 'zh' ? '未关联文章' : 'No post'}</option>
        {currentArticleTitle && !imageArticleOptions.includes(currentArticleTitle) && (
          <option className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100" value={currentArticleTitle}>
            {language === 'zh' ? `${currentArticleTitle}（文章可能已删除）` : `${currentArticleTitle} (post may be deleted)`}
          </option>
        )}
        {imageArticleOptions.map((articleTitle) => (
          <option className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100" key={articleTitle} value={articleTitle}>
            {articleTitle}
          </option>
        ))}
      </select>
    );
  };

  const renderNoVisibleUploadedImages = () => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
      <Image className="mb-2 h-8 w-8" />
      <p className="text-sm">
        {language === 'zh'
          ? `“${selectedImageArticleFilterLabel}”下暂无图片`
          : `No images under “${selectedImageArticleFilterLabel}”`}
      </p>
      <p className="mt-1 text-xs">
        {language === 'zh' ? '可以为图片选择文章标签，或切换到其他分类查看。' : 'Assign post tags to images or switch to another category.'}
      </p>
    </div>
  );

  // 渲染命令结果
  const renderCommandResult = () => {
    if (!commandResult) return null;

    // 限制输出长度和宽度
    const truncateText = (text, maxLength = 500) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const formatOutput = (text) => {
      if (!text) return '';
      // 限制每行长度，避免过宽
      const lines = text.split('\n');
      const formattedLines = lines.map(line => {
        if (line.length > 80) {
          return line.substring(0, 80) + '...';
        }
        return line;
      });
      return truncateText(formattedLines.join('\n'));
    };

    return (
      <Alert className={commandResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <AlertDescription>
          <div className="font-mono text-xs whitespace-pre-wrap break-words overflow-hidden max-w-full">
            {commandResult.success ? (
              <div className="text-green-700">
                <div className="font-semibold">✓ {t.commandExecuteSuccess}</div>
                {commandResult.stdout && (
                  <div className="mt-2 max-h-32 overflow-y-auto overflow-x-hidden">
                    {formatOutput(commandResult.stdout)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <div className="font-semibold">✗ {t.commandExecuteFailed}</div>
                {commandResult.error && (
                  <div className="mt-2 max-h-32 overflow-y-auto overflow-x-hidden">
                    {formatOutput(commandResult.error)}
                  </div>
                )}
                {commandResult.stderr && (
                  <div className="mt-2 max-h-32 overflow-y-auto overflow-x-hidden">
                    {formatOutput(commandResult.stderr)}
                  </div>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="app-shell bg-background flex flex-col">
      {/* 自定义标题栏 - 固定在顶部 */}
      <CustomTitlebar />
      
      {/* 顶部导航栏 - 添加顶部边距以避免被固定标题栏遮挡 */}
      <header className="app-header-bar border-b bg-card mt-10 shrink-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-3 lg:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-xl font-bold">Hexo Hub</h1>
            {isValidHexoProject && (
              <Badge variant="default" className="bg-green-500">
                {language === 'zh' ? '已连接' : 'Connected'}
              </Badge>
            )}
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {enableAI && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInspirationDialog(true)}
                  disabled={!isValidHexoProject || isLoading || !apiKey}
                  title={t.getInspiration}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {t.getInspiration}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiagnosticDialog(true)}
                  disabled={!apiKey}
                  title={language === 'zh' ? 'AI 辅助诊断（排查软件/项目问题）' : 'AI assistant diagnosis'}
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  {language === 'zh' ? 'AI 诊断' : 'AI Diagnose'}
                </Button>
              </>
            )}
            <Button
              variant={mainView === 'posts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('posts')}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.articles}
            </Button>
            <Button
              variant={mainView === 'images' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedPost(null);
                setMainView('images');
              }}
              disabled={!isValidHexoProject}
            >
              <Image className="w-4 h-4 mr-2" />
              {language === 'zh' ? '图片' : 'Images'}
            </Button>
            <Button
              variant={mainView === 'config' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('config')}
              disabled={!isValidHexoProject}
            >
              <Settings className="w-4 h-4 mr-2" />
              {t.hexoConfig}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeHexoCommand(enableCustomCommands ? customCleanCommand : 'clean', enableCustomCommands)}
              disabled={!isValidHexoProject || isLoading || !isElectron}
            >
              <Terminal className="w-4 h-4 mr-2" />
              {t.clean}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeHexoCommand(enableCustomCommands ? customGenerateCommand : 'generate', enableCustomCommands)}
              disabled={!isValidHexoProject || isLoading || !isElectron}
            >
              <Play className="w-4 h-4 mr-2" />
              {t.generate}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeHexoCommand(enableCustomCommands ? customDeployCommand : 'deploy', enableCustomCommands)}
              disabled={!isValidHexoProject || isLoading || !isElectron}
            >
              <Globe className="w-4 h-4 mr-2" />
              {t.deploy}
            </Button>
            {enablePush && (
              <Button
                variant="outline"
                size="sm"
                onClick={pushToRemote}
                disabled={!isValidHexoProject || isLoading || !isElectron}
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.push}
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={oneClickPublish}
              disabled={!isValidHexoProject || isLoading || !isElectron}
              title={t.oneClickPublish}
            >
              <Rocket className="w-4 h-4 mr-2" />
              {t.oneClickPublish}
            </Button>
            <Button
              variant={isServerRunning ? "destructive" : "default"}
              size="sm"
              onClick={isServerRunning ? stopHexoServer : startHexoServer}
              disabled={!isValidHexoProject || isLoading || !isElectron}
            >
              {isServerRunning ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  {t.stopServer}
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 mr-2" />
                  {t.startServer}
                </>
              )}
            </Button>

            {/* 语言切换按钮 */}
            <div className="border-l pl-2 ml-1 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                title={language === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                <Languages className="w-4 h-4 mr-1" />
                {language === 'zh' ? 'EN' : '中文'}
              </Button>

              {/* 一键主题切换按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                title={language === 'zh' ? '一键切换主题' : 'One-click theme switch'}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 mr-1" />
                ) : currentTheme === 'system' ? (
                  <Palette className="w-4 h-4 mr-1" />
                ) : (
                  <Moon className="w-4 h-4 mr-1" />
                )}
                <span className="hidden xl:inline">{getAppThemeOption(currentTheme).label[language]}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-main-layout flex flex-1">
        {/* 侧边栏 */}
        {/* 左侧栏内容过多时，设置 overflow-y-auto，会在侧边栏内部滚动，而不会影响整个页面的大小 */}
        <aside className="app-sidebar border-r bg-background flex flex-col overflow-y-auto">
          {/* 项目选择 */}
          <Card className="m-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                {t.hexoProject}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={hexoPath}
                  placeholder={t.selectHexoDirectory}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectHexoDirectory}
                  disabled={isLoading}
                >
                  {t.select}
                </Button>
                {hexoPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSavedPath}
                    disabled={isLoading}
                    title={t.clearSavedPath}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-2 mt-2">
                <CreateHexoDialog
                  onCreateSuccess={async (path) => {
                    const normalizedPath = normalizePath(path);
                    setHexoPath(normalizedPath);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('hexo-project-path', normalizedPath);
                    }
                    await validateHexoProject(normalizedPath);
                  }}
                  language={language}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    title="创建新的Hexo项目"
                    className="w-full"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t.createHexoProject}
                  </Button>
                </CreateHexoDialog>
              </div>

              {validationMessage && (
                <div className={`text-xs p-2 rounded ${
                  isValidHexoProject
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {validationMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 文章列表按钮 */}
          <Card className="m-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t.articleList}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('posts');
                }}
                disabled={!isValidHexoProject || isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.viewArticleList}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('images');
                }}
                disabled={!isValidHexoProject || isLoading}
              >
                <Image className="w-4 h-4 mr-2" />
                {language === 'zh' ? '图片管理' : 'Image Manager'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createNewPost();
                }}
                disabled={!isValidHexoProject || isLoading}
                title={t.createNewArticle}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.createNewArticle}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('statistics');
                }}
                disabled={!isValidHexoProject || isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.viewTagCloud}
              </Button>
            </CardContent>
          </Card>

          <ExternalAnalyticsCards
            language={language}
            giscusRepo={giscusRepo}
            giscusCategory={giscusCategory}
            giscusToken={giscusToken}
            ga4PropertyId={ga4PropertyId}
            ga4ServiceAccountJson={ga4ServiceAccountJson}
            onOpenGiscusAnalytics={() => {
              setSelectedPost(null);
              setMainView('giscus-analytics');
            }}
            onOpenGa4Analytics={() => {
              setSelectedPost(null);
              setMainView('ga4-analytics');
            }}
          />

          {/* 博客主题 */}
          <Card className="m-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Palette className="w-4 h-4 mr-2 text-blue-600" />
                {language === 'zh' ? '博客主题' : 'Blog Theme'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('blog-theme');
                }}
                disabled={!isValidHexoProject || isLoading}
                title={language === 'zh' ? '一键切换博客主题' : 'Switch blog theme'}
              >
                <Palette className="w-4 h-4 mr-2" />
                {language === 'zh' ? '主题管理' : 'Theme Manager'}
              </Button>
            </CardContent>
          </Card>

          {/* 面板设置 */}
          <Card className="m-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                {t.panelSettings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('settings');
                }}
                disabled={isLoading}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t.panelSettings}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedPost(null);
                  setMainView('logs');
                }}
                disabled={isLoading}
              >
                <Terminal className="w-4 h-4 mr-2" />
                {t.viewLogs}
              </Button>
            </CardContent>
          </Card>


        </aside>

        {/* 主内容区域 */}
        <main className="app-main-content flex-1 flex flex-col overflow-hidden">
          {mainView === 'statistics' ? (
            <div className="app-scroll-area flex-1">
              <TagCloud tags={allTagsForCloud} language={language} />
              <PublishStats 
                posts={posts} 
                language={language} 
                onStatsDataChange={setPublishStatsData} 
              />
              {enableAI && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                      {t.articleAnalysis}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {language === 'zh' 
                          ? '使用AI分析您的博客数据，获得鼓励性的反馈和建议。' 
                          : 'Use AI to analyze your blog data and get encouraging feedback and suggestions.'}
                      </p>
                      <Button
                        onClick={() => setShowAnalysisDialog(true)}
                        disabled={!apiKey}
                        className="w-full"
                      >
                        {language === 'zh' ? '开始分析' : 'Start Analysis'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : mainView === 'giscus-analytics' ? (
            <GiscusCommentsAnalyticsPage
              language={language}
              repo={giscusRepo}
              category={giscusCategory}
              token={giscusToken}
            />
          ) : mainView === 'ga4-analytics' ? (
            <Ga4ViewsAnalyticsPage
              language={language}
              propertyId={ga4PropertyId}
              serviceAccountJson={ga4ServiceAccountJson}
            />
          ) : mainView === 'blog-theme' ? (
            <div className="app-scroll-area flex-1">
              <BlogThemePanel hexoPath={hexoPath} language={language} />
            </div>
          ) : mainView === 'settings' ? (
            <div className="app-scroll-area flex-1">
              <PanelSettings
                updateAvailable={updateAvailable}
                onUpdateCheck={() => checkForUpdates(false)}
                updateCheckInProgress={updateCheckInProgress}
                autoCheckUpdates={autoCheckUpdates}
                onAutoCheckUpdatesChange={handleAutoCheckUpdatesChange} 
              autoSaveInterval={autoSaveInterval}
              onAutoSaveIntervalChange={handleAutoSaveIntervalChange}

                postsPerPage={postsPerPage}
                onPostsPerPageChange={handlePostsPerPageChange}
                editorMode={editorMode}
                onEditorModeChange={setEditorMode}
                backgroundImage={backgroundImage}
                onBackgroundImageChange={setBackgroundImage}
                backgroundOpacity={backgroundOpacity}
                onBackgroundOpacityChange={setBackgroundOpacity}
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                language={language}
                // 推送设置
                enablePush={enablePush}
                onEnablePushChange={setEnablePush}
                pushRepoUrl={pushRepoUrl}
                onPushRepoUrlChange={setPushRepoUrl}
                pushBranch={pushBranch}
                onPushBranchChange={setPushBranch}
                pushUsername={pushUsername}
                onPushUsernameChange={setPushUsername}
                pushEmail={pushEmail}
                onPushEmailChange={setPushEmail}
                // 自定义指令设置
                enableCustomCommands={enableCustomCommands}
                onEnableCustomCommandsChange={setEnableCustomCommands}
                customCleanCommand={customCleanCommand}
                onCustomCleanCommandChange={setCustomCleanCommand}
                customGenerateCommand={customGenerateCommand}
                onCustomGenerateCommandChange={setCustomGenerateCommand}
                customServerCommand={customServerCommand}
                onCustomServerCommandChange={setCustomServerCommand}
                customDeployCommand={customDeployCommand}
                onCustomDeployCommandChange={setCustomDeployCommand}
                // AI设置
                enableAI={enableAI}
                onEnableAIChange={setEnableAI}
                enableEditorAI={enableEditorAI}
                onEnableEditorAIChange={setEnableEditorAI}
                aiProvider={aiProvider}
                onAIProviderChange={setAIProvider}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                prompt={prompt}
                onPromptChange={setPrompt}
                analysisPrompt={analysisPrompt}
                onAnalysisPromptChange={setAnalysisPrompt}
                openaiModel={openaiModel}
                onOpenaiModelChange={setOpenaiModel}
                openaiApiEndpoint={openaiApiEndpoint}
                onOpenaiApiEndpointChange={setOpenaiApiEndpoint}
                openaiApiPath={openaiApiPath}
                onOpenaiApiPathChange={setOpenaiApiPath}
                imageBaseUrl={imageBaseUrl}
                onImageBaseUrlChange={setImageBaseUrl}
                giscusRepo={giscusRepo}
                onGiscusRepoChange={setGiscusRepo}
                giscusCategory={giscusCategory}
                onGiscusCategoryChange={setGiscusCategory}
                giscusToken={giscusToken}
                onGiscusTokenChange={setGiscusToken}
                ga4PropertyId={ga4PropertyId}
                onGa4PropertyIdChange={setGa4PropertyId}
                ga4ServiceAccountJson={ga4ServiceAccountJson}
                onGa4ServiceAccountJsonChange={setGa4ServiceAccountJson}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                iframeUrlMode={iframeUrlMode}
                onIframeUrlModeChange={setIframeUrlMode}
              />
            </div>
          ) : mainView === 'logs' ? (
            <div className="app-scroll-area flex-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="w-5 h-5 mr-2" />
                    {t.operationLogs}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {commandLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t.noLogs}
                      </div>
                    ) : (
                      commandLogs.map((log, index) => (
                        <div key={index} className={`p-3 rounded-md border ${log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-black dark:text-black">{log.command}</div>
                            <div className="text-xs text-muted-foreground">{log.timestamp}</div>
                          </div>
                          <div className={`text-sm ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                            {log.success ? (
                              <div>
                                <div className="font-semibold">{t.commandExecutedSuccess}</div>
                                {log.stdout && (
                                  <div className="mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-900 p-2 rounded border font-mono text-xs whitespace-pre-wrap">
                                    {log.stdout}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold">{t.commandExecutedFailed}</div>
                                {log.error && (
                                  <div className="mt-1 text-red-800 dark:text-red-200 font-medium">
                                    {log.error}
                                  </div>
                                )}
                                {log.stderr && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">错误详情：</div>
                                    <div className="max-h-48 overflow-y-auto bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-300 dark:border-red-700 font-mono text-xs whitespace-pre-wrap">
                                      {/* 移除 ANSI 颜色代码 */}
                                      {log.stderr.replace(/\u001b\[[0-9;]*m/g, '')}
                                    </div>
                                  </div>
                                )}
                                {log.stdout && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">标准输出：</div>
                                    <div className="max-h-48 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-2 rounded border font-mono text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                      {/* 移除 ANSI 颜色代码 */}
                                      {log.stdout.replace(/\u001b\[[0-9;]*m/g, '')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {commandLogs.length > 0 && (
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 构建日志文本内容
                          const logsText = commandLogs.map(log => {
                            let logContent = `【${log.command}】${log.timestamp}\n`;
                            if (log.success) {
                              logContent += `状态: 成功\n`;
                              if (log.stdout) logContent += `输出:\n${log.stdout.replace(/\u001b\[[0-9;]*m/g, '')}\n`;
                            } else {
                              logContent += `状态: 失败\n`;
                              if (log.error) logContent += `错误: ${log.error}\n`;
                              if (log.stderr) logContent += `错误详情:\n${log.stderr.replace(/\u001b\[[0-9;]*m/g, '')}\n`;
                              if (log.stdout) logContent += `标准输出:\n${log.stdout.replace(/\u001b\[[0-9;]*m/g, '')}\n`;
                            }
                            logContent += '---\n';
                            return logContent;
                          }).join('\n');
                          
                          // 复制到剪贴板
                          navigator.clipboard.writeText(logsText).then(() => {
                            toast({
                              title: t.copySuccess,
                              description: t.logsCopiedToClipboard,
                              variant: "default"
                            });
                          }).catch(() => {
                            // 降级方案：创建文本区域并选择
                            const textArea = document.createElement("textarea");
                            textArea.value = logsText;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            toast({
                              title: t.copySuccess,
                              description: t.logsCopiedToClipboard,
                              variant: "default"
                            });
                          });
                        }}
                      >
                        {t.copyLogs}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCommandLogs([])}
                      >
                        {t.clearLogs}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : mainView === 'images' ? (
            <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
              <div className="border-b p-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{language === 'zh' ? '图片管理' : 'Image Manager'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {language === 'zh' ? '统一管理 Hexo source/images 图片，不与文章列表混排。' : 'Manage Hexo source/images separately from the article list.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {language === 'zh' ? `${visibleUploadedImages.length}/${uploadedImages.length} 张图片` : `${visibleUploadedImages.length}/${uploadedImages.length} images`}
                  </Badge>
                  <Button
                    variant={imageViewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setImageViewMode('list')}
                    title={language === 'zh' ? '列表视图' : 'List view'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={imageViewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setImageViewMode('grid')}
                    title={language === 'zh' ? '图标视图' : 'Grid view'}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="app-scroll-area flex-1">
                {isValidHexoProject ? (
                  <Card
                    ref={imageManagerDropAreaRef}
                    className={`border bg-background transition-colors ${isImageDragOver ? 'border-blue-400 bg-blue-50/70 shadow-sm dark:bg-blue-950/30' : 'border-border'}`}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                  >
                    <CardContent className="space-y-4 p-4">
                      <div className={`rounded-lg border border-dashed p-4 text-center transition-colors ${isImageDragOver ? 'border-blue-500 bg-blue-100/70 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'border-muted-foreground/30 bg-muted/20 text-muted-foreground'}`}>
                        <Upload className="mx-auto mb-2 h-7 w-7" />
                        <p className="text-sm font-medium">
                          {isImageDragOver
                            ? (language === 'zh' ? '松开鼠标上传图片' : 'Release to upload images')
                            : (language === 'zh' ? '拖动图片到这里上传' : 'Drag images here to upload')}
                        </p>
                        <p className="mt-1 text-xs">
                          {language === 'zh'
                            ? '所有图片会保存到 Hexo 的 source/images 目录'
                            : 'All images are saved to Hexo source/images'}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={uploadImageToSourceImages}
                            disabled={isUploadingImage || isLoading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploadingImage ? (language === 'zh' ? '上传中...' : 'Uploading...') : (language === 'zh' ? '选择图片' : 'Choose Image')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadImageFiles(hexoPath)}
                            disabled={isUploadingImage || isLoading}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '刷新' : 'Refresh'}
                          </Button>
                        </div>
                      </div>

                      {renderImageArticleFilterControls()}

                      {uploadedImages.length > 0 ? (
                        visibleUploadedImages.length > 0 ? (
                          imageViewMode === 'list' ? (
                            <div className="overflow-auto rounded-lg border">
                              {visibleUploadedImages.map((image) => (
                                <div key={image.path} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Image className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-medium">{image.name}</div>
                                      <div className="text-xs text-muted-foreground">{formatUploadedImageSize(image.size)}</div>
                                      <div className="mt-1 flex flex-wrap items-center gap-1">
                                        {getImageArticleTag(image.name) ? (
                                          <Badge variant="secondary" className="max-w-48 truncate text-[10px]">
                                            {language === 'zh' ? '文章：' : 'Post: '}{getImageArticleTag(image.name)}
                                          </Badge>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">
                                            {language === 'zh' ? '未关联文章' : 'No linked post'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-shrink-0 items-center gap-1">
                                    {renderImageArticleTagSelect(image)}
                                    <Badge variant="outline" className="hidden text-[10px] md:inline-flex">
                                      /images/{image.name}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => renameUploadedImage(image)}
                                      title={language === 'zh' ? '重命名图片' : 'Rename image'}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      onClick={() => deleteUploadedImage(image)}
                                      title={language === 'zh' ? '删除图片' : 'Delete image'}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                              {visibleUploadedImages.map((image) => (
                                <div key={image.path} className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
                                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                    <Image className="h-6 w-6" />
                                  </div>
                                  <div className="truncate text-xs font-medium" title={image.name}>{image.name}</div>
                                  <div className="mt-1 text-[10px] text-muted-foreground">{formatUploadedImageSize(image.size)}</div>
                                  <div className="mt-2 flex justify-center">
                                    {renderImageArticleTagSelect(image, true)}
                                  </div>
                                  <div className="mt-3 flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => renameUploadedImage(image)}
                                      title={language === 'zh' ? '重命名图片' : 'Rename image'}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                      onClick={() => deleteUploadedImage(image)}
                                      title={language === 'zh' ? '删除图片' : 'Delete image'}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          renderNoVisibleUploadedImages()
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                          <Image className="mb-2 h-8 w-8" />
                          <p className="text-sm">{language === 'zh' ? '还没有上传图片' : 'No uploaded images yet'}</p>
                          <p className="mt-1 text-xs">{language === 'zh' ? '拖动图片到上方区域，或点击选择图片。' : 'Drag images above or choose an image.'}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <Image className="w-16 h-16 mx-auto text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {t.selectProjectFirst}
                      </h3>
                      <p className="text-gray-500">
                        {t.clickSelectButton}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : mainView === 'posts' ? (
            selectedPost ? (
              <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden editor-container">
                {/* 固定在顶部的编辑器控制栏 */}
                <div className="border-b bg-card p-3 flex shrink-0 flex-col gap-2 sticky top-0 z-10">
                  {/* 文章标题栏 */}
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <h2 className="truncate text-lg font-semibold" title={selectedPost.name}>{selectedPost.name}</h2>
                      <Badge variant="outline">
                        {selectedPost.size} bytes
                      </Badge>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                      {isUsingExternalEditor ? (
                        // 外部编辑器模式：只显示重新加载按钮
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!selectedPost || !isElectron) return;

                            try {
                              if (isTauri()) {
                                const { invoke } = await import('@tauri-apps/api/core');
                                const content = await invoke('read_file', { filePath: selectedPost.path });
                                setPostContent(content as string);
                              } else {
                                const ipcRenderer = await getIpcRenderer();
                                const content = await ipcRenderer.invoke('read-file', selectedPost.path);
                                setPostContent(content);
                              }

                              setIsUsingExternalEditor(false);
                              toast({
                                title: t.contentReloaded,
                                description: t.contentReloadedDescription,
                              });
                            } catch (error) {
                              console.error('重新加载内容失败:', error);
                              toast({
                                title: t.reloadFailed,
                                description: error instanceof Error ? error.message : String(error),
                                variant: 'error',
                              });
                            }
                          }}
                          disabled={isLoading}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t.reloadContent}
                        </Button>
                      ) : (
                        // 内部编辑器模式：显示所有按钮
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 退出全屏模式
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              }
                              setSelectedPost(null);
                            }}
                            disabled={isLoading}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t.backToList}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const editorContainer = document.querySelector('.editor-container') as HTMLElement;
                              if (editorContainer) {
                                if (document.fullscreenElement) {
                                  document.exitFullscreen();
                                } else {
                                  // 保存原始样式
                                  const originalStyle = {
                                    height: editorContainer.style.height,
                                    width: editorContainer.style.width,
                                    display: editorContainer.style.display,
                                    flexDirection: editorContainer.style.flexDirection,
                                    zIndex: editorContainer.style.zIndex
                                  };
                                  
                                  // 设置全屏样式
                                  editorContainer.style.height = '100vh';
                                  editorContainer.style.width = '100vw';
                                  editorContainer.style.display = 'flex';
                                  editorContainer.style.flexDirection = 'column';
                                  editorContainer.style.zIndex = '9999';
                                  
                                  editorContainer.requestFullscreen().then(() => {
                                    // 进入全屏后显示提示
                                    toast({
                                      title: "全屏模式",
                                      description: "按 ESC 键退出全屏",
                                      duration: 3000,
                                    });
                                    
                                    // 监听全屏变化事件，退出时恢复原始样式
                                    const handleFullscreenChange = () => {
                                      if (!document.fullscreenElement) {
                                        // 恢复原始样式
                                        Object.keys(originalStyle).forEach(key => {
                                          editorContainer.style[key] = originalStyle[key];
                                        });
                                        document.removeEventListener('fullscreenchange', handleFullscreenChange);
                                      }
                                    };
                                    
                                    document.addEventListener('fullscreenchange', handleFullscreenChange);
                                  }).catch(err => {
                                    console.error('无法进入全屏模式:', err);
                                    // 恢复原始样式
                                    Object.keys(originalStyle).forEach(key => {
                                      editorContainer.style[key] = originalStyle[key];
                                    });
                                  });
                                }
                              }
                            }}
                            disabled={isLoading}
                            title={t.fullscreenMode}
                          >
                            <Square className="w-4 h-4 mr-2" />
                            {t.fullscreenMode}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!selectedPost || !isElectron) return;

                              // 退出全屏模式
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              }

                              try {
                                if (isTauri()) {
                                  // Tauri 环境
                                  const { invoke } = await import('@tauri-apps/api/core');
                                  await invoke('open_with', { filePath: selectedPost.path });
                                } else {
                                  // Electron 环境
                                  const ipcRenderer = await getIpcRenderer();
                                  await ipcRenderer.invoke('open-with', selectedPost.path);
                                }

                                // 设置为使用外部编辑器
                                setIsUsingExternalEditor(true);

                                // 提示用户
                                toast({
                                  title: t.externalEditorOpened,
                                  description: t.externalEditorDescription,
                                  duration: 5000,
                                });
                              } catch (error) {
                                console.error('打开文件失败:', error);
                                toast({
                                  title: '打开文件失败',
                                  description: error instanceof Error ? error.message : String(error),
                                  variant: 'error',
                                });
                              }
                            }}
                            disabled={isLoading}
                            title={t.openWithExternalEditor}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t.externalEditor}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExtractImages}
                            disabled={isLoading || isExtractingImages || !selectedPost || !isElectron}
                            title={language === 'zh'
                              ? '提取文章中的外部网络图片到 source/images，并替换为本地引用'
                              : 'Extract external images in the post to source/images and replace references'}
                          >
                            {isExtractingImages ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            {isExtractingImages
                              ? (language === 'zh' ? '提取中...' : 'Extracting...')
                              : (language === 'zh' ? '提取图片' : 'Extract Images')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 保存文章，但不退出全屏模式
                              savePost();
                            }}
                            disabled={isLoading}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {t.saveArticle}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 退出全屏模式
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              }
                              setShowDeletePostDialog(true);
                            }}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t.deleteArticle}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 编辑-预览转换栏和Markdown快捷语法栏 */}
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="editor" className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" />
                            {t.edit}
                          </TabsTrigger>
                          <TabsTrigger value="preview" className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            {t.preview}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span className="text-xs bg-background border px-2 py-1 rounded">
                          {postContent.split('').length} 行
                        </span>
                      </div>
                    </div>

                    {/* Markdown快捷语法栏 */}
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = '# ';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="标题 1" className="h-8 w-8 p-0">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = '## ';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="标题 2" className="h-8 w-8 p-0">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = '### ';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="标题 3" className="h-8 w-8 p-0">
                        <Heading3 className="w-4 h-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1" />

                      {/* 字体颜色选择器（Portal 渲染到 body，避免被 sticky 堆叠上下文遮挡） */}
                      <div className="relative" ref={textColorAnchorRef}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-1.5"
                          onClick={() => setIsTextColorPickerOpen((prev) => !prev)}
                          title={language === 'zh' ? '文字颜色' : 'Text color'}
                        >
                          <span className="relative flex h-4 w-4 items-center justify-center">
                            <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: currentTextColor || 'var(--foreground)' }} />
                          </span>
                        </Button>
                        {isTextColorPickerOpen && textColorAnchorRef.current &&
                          createPortal(
                            <>
                              <div className="fixed inset-0 z-[9998]" onClick={() => setIsTextColorPickerOpen(false)} />
                              <ColorPickerPopover
                                anchorEl={textColorAnchorRef.current}
                                currentTextColor={currentTextColor}
                                onPick={(color) => {
                                  handleTextColor(color);
                                  setIsTextColorPickerOpen(false);
                                }}
                                onClear={() => {
                                  handleClearTextColor();
                                  setIsTextColorPickerOpen(false);
                                }}
                                language={language}
                              />
                            </>,
                            document.body
                          )}
                      </div>

                      {/* 清理富文本格式：删除语雀 <font style> 标签，保留内容 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-1.5"
                        onClick={handleCleanRichText}
                        title={language === 'zh' ? '清理富文本格式（删除 <font style> 标签，保留文字）' : 'Clean rich text (remove <font style> tags, keep text)'}
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = postContent.substring(start, end);
                          const wrappedText = '**' + selectedText + '**';
                          const newValue = postContent.substring(0, start) + wrappedText + postContent.substring(end);
                          setPostContent(newValue);
                          setTimeout(() => {
                            if (selectedText.length === 0) {
                              const newPos = start + 2;
                              textarea.selectionStart = textarea.selectionEnd = newPos;
                            } else {
                              textarea.selectionStart = start;
                              textarea.selectionEnd = start + wrappedText.length;
                            }
                            textarea.focus();
                          }, 0);
                        }
                      }} title="粗体" className="h-8 w-8 p-0">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = postContent.substring(start, end);
                          const wrappedText = '*' + selectedText + '*';
                          const newValue = postContent.substring(0, start) + wrappedText + postContent.substring(end);
                          setPostContent(newValue);
                          setTimeout(() => {
                            if (selectedText.length === 0) {
                              const newPos = start + 1;
                              textarea.selectionStart = textarea.selectionEnd = newPos;
                            } else {
                              textarea.selectionStart = start;
                              textarea.selectionEnd = start + wrappedText.length;
                            }
                            textarea.focus();
                          }, 0);
                        }
                      }} title="斜体" className="h-8 w-8 p-0">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = postContent.substring(start, end);
                          const wrappedText = '`' + selectedText + '`';
                          const newValue = postContent.substring(0, start) + wrappedText + postContent.substring(end);
                          setPostContent(newValue);
                          setTimeout(() => {
                            if (selectedText.length === 0) {
                              const newPos = start + 1;
                              textarea.selectionStart = textarea.selectionEnd = newPos;
                            } else {
                              textarea.selectionStart = start;
                              textarea.selectionEnd = start + wrappedText.length;
                            }
                            textarea.focus();
                          }, 0);
                        }
                      }} title="行内代码" className="h-8 w-8 p-0">
                        <Code className="w-4 h-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1" />

                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = ' - ';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="无序列表" className="h-8 w-8 p-0">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = ' 1. ';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="有序列表" className="h-8 w-8 p-0">
                        <ListOrdered className="w-4 h-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1" />

                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = postContent.substring(start, end);
                          const wrappedText = '[' + selectedText + '](url)';
                          const newValue = postContent.substring(0, start) + wrappedText + postContent.substring(end);
                          setPostContent(newValue);
                          setTimeout(() => {
                            if (selectedText.length === 0) {
                              const newPos = start + 1;
                              textarea.selectionStart = textarea.selectionEnd = newPos;
                            } else {
                              textarea.selectionStart = start;
                              textarea.selectionEnd = start + wrappedText.length;
                            }
                            textarea.focus();
                          }, 0);
                        }
                      }} title="链接" className="h-8 w-8 p-0">
                        <Link className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (hexoPath) {
                          await loadImageFiles(hexoPath);
                        }
                        setShowImagePickerDialog(true);
                      }} title="图片" className="h-8 w-8 p-0">
                        <Image className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 单元格1 | 单元格2 | 单元格3 |
`;

                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="表格" className="h-8 w-8 p-0">
                        <Table className="w-4 h-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1" />

                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const selectedText = postContent.substring(textarea.selectionStart, textarea.selectionEnd) || 'code here';
                          const codeBlock = `\`\`\`js
${selectedText}
\`\`\`
`;
                          const newValue = postContent.substring(0, start) + codeBlock + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + codeBlock.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="代码块" className="h-8 w-8 p-0">
                        <Code className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = postContent.substring(start, end);
                          
                          // 如果没有选中文本，直接插入引用符号
                          if (!selectedText) {
                            const insertText = '> ';
                            const newValue = postContent.substring(0, start) + insertText + postContent.substring(end);
                            setPostContent(newValue);
                            setTimeout(() => {
                              textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                              textarea.focus();
                            }, 0);
                            return;
                          }
                          
                          // 如果有选中文本，为每行添加引用符号
                          const lines = selectedText.split('\n');
                          const quotedLines = lines.map(line => '> ' + line).join('\n');
                          const newValue = postContent.substring(0, start) + quotedLines + postContent.substring(end);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = start;
                            textarea.selectionEnd = start + quotedLines.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="引用" className="h-8 w-8 p-0">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const insertText = '---';
                          const newValue = postContent.substring(0, start) + insertText + postContent.substring(textarea.selectionEnd);
                          setPostContent(newValue);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                            textarea.focus();
                          }, 0);
                        }
                      }} title="分割线" className="h-8 w-8 p-0">
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 编辑器区域 */}
                <div className="editor-workspace flex-1 overflow-hidden">
                  {isUsingExternalEditor ? (
                    // 使用外部编辑器时的提示信息
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="mb-4">
                        <ExternalLink className="w-16 h-16 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{t.usingExternalEditor}</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        {t.externalEditorHint}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={async () => {
                            if (!selectedPost || !isElectron) return;

                            try {
                              if (isTauri()) {
                                const { invoke } = await import('@tauri-apps/api/core');
                                const content = await invoke('read_file', { filePath: selectedPost.path });
                                setPostContent(content as string);
                              } else {
                                const ipcRenderer = await getIpcRenderer();
                                const content = await ipcRenderer.invoke('read-file', selectedPost.path);
                                setPostContent(content);
                              }

                              setIsUsingExternalEditor(false);
                              toast({
                                title: t.contentReloaded,
                                description: t.contentReloadedDescription,
                              });
                            } catch (error) {
                              console.error('重新加载内容失败:', error);
                              toast({
                                title: t.reloadFailed,
                                description: error instanceof Error ? error.message : String(error),
                                variant: 'error',
                              });
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t.reloadContent}
                        </Button>

                      </div>
                    </div>
                  ) : editorMode === 'mode1' ? (
                    // 模式1：编辑器和预览左右并排显示（实时预览）
                    <div className="editor-split-container h-full flex flex-row overflow-hidden relative rounded-xl border bg-background shadow-sm">
                      {/* 左侧：编辑器 */}
                      <div
                        className="editor-split-pane w-full overflow-hidden bg-background"
                        style={{
                          width: `calc(${splitRatio * 100}%)`
                        }}
                      >
                        <div className="h-full overflow-hidden">
                          <MarkdownEditorWrapper
                            value={postContent}
                            onChange={setPostContent}
                            onSave={savePost}
                            isLoading={isLoading}
                            language={language}
                            hexoPath={hexoPath}
                            selectedPost={selectedPost}
                            posts={posts}
                            enableAI={enableEditorAI}
                            aiProvider={aiProvider}
                            apiKey={apiKey}
                            openaiModel={openaiModel}
                            openaiApiEndpoint={openaiApiEndpoint}
                            openaiApiPath={openaiApiPath}
                          />
                        </div>
                      </div>

                      {/* 可拖动的分隔条 */}
                      <div
                        className="editor-split-resizer absolute top-0 bottom-0 w-2 -translate-x-1 cursor-col-resize bg-gradient-to-b from-blue-400 via-indigo-500 to-purple-500 opacity-80 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_18px_rgba(99,102,241,0.45)] transition-all hover:opacity-100 hover:w-3 z-20"
                        style={{ left: `calc(${splitRatio * 100}%)` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsDragging(true);

                          const startX = e.clientX;
                          const containerWidth = e.currentTarget.parentElement?.offsetWidth || 0;
                          const startRatio = splitRatio;
                          let dragging = true;

                          const handleMouseMove = (e: MouseEvent) => {
                            if (!dragging) return;
                            const deltaX = e.clientX - startX;
                            const newRatio = Math.max(0.2, Math.min(0.8, startRatio + (deltaX / containerWidth)));
                            setSplitRatio(newRatio);
                          };

                          const handleMouseUp = () => {
                            dragging = false;
                            setIsDragging(false);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />

                      {/* 右侧：预览 */}
                      <div
                        className="editor-split-pane w-full overflow-hidden bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(168,85,247,0.12)_45%,rgba(14,165,233,0.10))] dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.32),rgba(88,28,135,0.26)_45%,rgba(12,74,110,0.24))]"
                        style={{
                          width: `calc(${(1 - splitRatio) * 100}%)`
                        }}
                      >
                        {/* 预览工具栏 */}
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-blue-200/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-blue-900/60 dark:bg-slate-950/85 sticky top-0 z-10">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                              <Monitor className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex min-w-0 flex-col leading-none">
                              <span className="truncate text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {previewMode === 'server' ? (language === 'zh' ? '服务器预览' : 'Server Preview') : (language === 'zh' ? '实时预览' : 'Live Preview')}
                              </span>
                              <span className="mt-1 hidden truncate text-[11px] text-muted-foreground xl:block">
                                {language === 'zh' ? '右侧为渲染后的文章效果，不再是源码编辑区' : 'Rendered article view, separate from source editor'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {previewMode === 'server' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                onClick={() => setForcePreviewRefresh(true)}
                                title={language === 'zh' ? '刷新预览' : 'Refresh preview'}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {previewMode !== 'server' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                onClick={() => {
                                  // 在新窗口打开纯文本预览
                                  const previewWindow = window.open('', '_blank');
                                  if (previewWindow) {
                                    previewWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body><pre style="white-space:pre-wrap;font-family:monospace;padding:20px;">${postContent.replace(/</g, '&lt;')}</pre></body></html>`);
                                    previewWindow.document.close();
                                  }
                                }}
                                title={language === 'zh' ? '新窗口打开' : 'Open in new window'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="pointer-events-none absolute right-5 top-16 z-0 hidden select-none items-center gap-1 rounded-full border border-blue-200/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-500 shadow-sm backdrop-blur dark:border-blue-900/70 dark:bg-slate-950/60 dark:text-blue-300 md:flex">
                          <Sparkles className="h-3.5 w-3.5" />
                          {language === 'zh' ? '预览区域' : 'Preview Area'}
                        </div>
                        <MarkdownPreview
                          content={postContent}
                          className="h-[calc(100%-49px)] p-5"
                          previewMode={previewMode}
                          hexoPath={hexoPath}
                          selectedPost={selectedPost}
                          isServerRunning={isServerRunning}
                          onStartServer={startHexoServer}
                          forceRefresh={forcePreviewRefresh}
                          onForceRefreshComplete={() => setForcePreviewRefresh(false)}
                          iframeUrlMode={iframeUrlMode}
                          giscusRepo={giscusRepo}
                          giscusCategory={giscusCategory}
                          giscusToken={giscusToken}
                          language={language}
                        />
                      </div>
                    </div>
                  ) : (
                    // 模式2：同时显示编辑和预览，左右分栏
                    <div className="editor-split-container h-full flex flex-row overflow-hidden relative">
                      <div 
                        className="editor-split-pane w-full border-r overflow-hidden"
                        style={{ 
                          width: `calc(${splitRatio * 100}%)`
                        }}
                      >
                        <div className="h-full overflow-hidden">
                          <MarkdownEditorWrapper
                            value={postContent}
                            onChange={setPostContent}
                            onSave={savePost}
                            isLoading={isLoading}
                            language={language}
                            hexoPath={hexoPath}
                            selectedPost={selectedPost}
                            posts={posts}
                            enableAI={enableEditorAI}
                            aiProvider={aiProvider}
                            apiKey={apiKey}
                            openaiModel={openaiModel}
                            openaiApiEndpoint={openaiApiEndpoint}
                            openaiApiPath={openaiApiPath}
                          />
                        </div>
                      </div>
                      
                      {/* 可拖动的分隔条 */}
                      <div
                        className="editor-split-resizer absolute top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors z-10"
                        style={{ left: `calc(${splitRatio * 100}% - 2px)` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                          
                          const startX = e.clientX;
                          const containerWidth = e.currentTarget.parentElement?.offsetWidth || 0;
                          const startRatio = splitRatio;
                          let dragging = true; // 本地变量跟踪拖动状态
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            if (!dragging) return;
                            
                            const deltaX = e.clientX - startX;
                            const newRatio = Math.max(0.2, Math.min(0.8, startRatio + (deltaX / containerWidth)));
                            setSplitRatio(newRatio);
                          };
                          
                          const handleMouseUp = () => {
                            dragging = false;
                            setIsDragging(false);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                      
                      <div
                        className="editor-split-pane w-full overflow-hidden bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(168,85,247,0.09))] dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.24),rgba(88,28,135,0.20))]"
                        style={{ 
                          width: `calc(${(1 - splitRatio) * 100}%)`
                        }}
                      >
                        <MarkdownPreview
                          content={postContent}
                          className="h-full p-5"
                          previewMode={previewMode}
                          hexoPath={hexoPath}
                          selectedPost={selectedPost}
                          isServerRunning={isServerRunning}
                          onStartServer={startHexoServer}
                          forceRefresh={forcePreviewRefresh}
                          onForceRefreshComplete={() => setForcePreviewRefresh(false)}
                          iframeUrlMode={iframeUrlMode}
                          giscusRepo={giscusRepo}
                          giscusCategory={giscusCategory}
                          giscusToken={giscusToken}
                          language={language}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
                {/* 文章列表头部 */}
                <div className="border-b p-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{t.articleList}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      createNewPost();
                    }}
                    disabled={!isValidHexoProject || isLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.createNewArticle}
                  </Button>
                </div>

                {/* 文章列表内容 */}
                <div className="app-scroll-area flex-1">
                  {isValidHexoProject ? (
                    <div className="space-y-4">
                      <PostList
                        posts={filteredPosts}
                      selectedPost={selectedPost}
                      onPostSelect={(post) => {
                        selectPost(post);
                      }}
                      isLoading={isLoading}
                      onDeletePosts={deletePosts}
                      onAddTagsToPosts={addTagsToPosts}
                      onAddCategoriesToPosts={addCategoriesToPosts}
                      onDeletePost={deleteSinglePost}
                      onAddTagsToPost={addTagsToPost}
                      onAddCategoriesToPost={addCategoriesToPost}
                      availableTags={availableTags}
                      availableCategories={availableCategories}
                      onFilterByTag={filterByTag}
                      onFilterByCategory={filterByCategory}
                      onClearFilter={clearFilter}
                      currentFilter={currentFilter}
                      currentPage={currentPage}
                      postsPerPage={postsPerPage}
                        onPageChange={setCurrentPage}
                        language={language}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <FileText className="w-16 h-16 mx-auto text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {t.selectProjectFirst}
                        </h3>
                        <p className="text-gray-500">
                          {t.clickSelectButton}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* 配置视图 */
            <div className="app-scroll-area flex-1">
              <HexoConfig
                hexoPath={hexoPath}
                onConfigUpdate={() => {
                  setCommandResult({
                    success: true,
                    stdout: '配置已更新'
                  });
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* 创建文章对话框 */}
      <CreatePostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConfirm={handleCreatePostConfirm}
        isLoading={isLoading}
        availableTags={availableTags}
        availableCategories={availableCategories}
        hexoPath={hexoPath}
        language={language}
      />
      
      {/* 通知弹窗 */}
      <Toaster />

      {/* AI灵感对话框 */}
      <AIInspirationDialog
        open={showInspirationDialog}
        onOpenChange={setShowInspirationDialog}
        aiProvider={aiProvider}
        apiKey={apiKey}
        prompt={prompt}
        language={language}
        openaiModel={openaiModel}
        openaiApiEndpoint={openaiApiEndpoint}
        openaiApiPath={openaiApiPath}
      />

      {/* AI 辅助诊断对话框 */}
      <AIDiagnosticDialog
        open={showDiagnosticDialog}
        onOpenChange={setShowDiagnosticDialog}
        aiProvider={aiProvider}
        apiKey={apiKey}
        language={language}
        openaiModel={openaiModel}
        openaiApiEndpoint={openaiApiEndpoint}
        openaiApiPath={openaiApiPath}
        contextText={
          [
            `Hexo 项目路径: ${hexoPath || '(未选择)'}`,
            language === 'zh' ? '当前视图: ' : 'Current view: ',
            language === 'zh' ? '最近操作日志:' : 'Recent operation logs:',
            ...commandLogs.slice(-10).map((log) => `[${log.timestamp || ''}] ${log.command || ''} ${log.success ? 'OK' : 'FAILED'}`),
          ].join('\n')
        }
      />

      {/* 图片引用选择对话框 */}
      <Dialog open={showImagePickerDialog} onOpenChange={setShowImagePickerDialog}>
        <DialogContent className="max-h-[92vh] w-full max-w-[min(98vw,1440px)] sm:max-w-[min(98vw,1440px)] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600" />
              {language === 'zh' ? '引用图片库' : 'Image Library'}
            </DialogTitle>
            <DialogDescription>
              {language === 'zh'
                ? '从 source/images 图片库中选择图片，或直接拖动图片到下方卡片上传后引用。'
                : 'Choose an image from source/images, or drag images below to upload before inserting.'}
            </DialogDescription>
          </DialogHeader>

          <Card
            ref={imageManagerDropAreaRef}
            className={`max-h-[calc(92vh-180px)] overflow-hidden border bg-background transition-colors ${isImageDragOver ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/30' : 'border-border'}`}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-sm">
                  {language === 'zh' ? '已上传图片' : 'Uploaded Images'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {language === 'zh' ? `${visibleUploadedImages.length}/${uploadedImages.length} 张` : `${visibleUploadedImages.length}/${uploadedImages.length} images`}
                  </Badge>
                  <Button
                    variant={imageViewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setImageViewMode('list')}
                    title={language === 'zh' ? '列表视图' : 'List view'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={imageViewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setImageViewMode('grid')}
                    title={language === 'zh' ? '图标视图' : 'Grid view'}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(92vh-250px)] space-y-4 overflow-auto pr-4">
              <div className={`rounded-lg border border-dashed p-5 text-center transition-colors ${isImageDragOver ? 'border-blue-500 bg-blue-100/70 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'border-muted-foreground/30 bg-muted/20 text-muted-foreground'}`}>
                <Upload className="mx-auto mb-2 h-7 w-7" />
                <p className="text-sm font-medium">
                  {isImageDragOver
                    ? (language === 'zh' ? '松开鼠标上传到图片库' : 'Release to upload to image library')
                    : (language === 'zh' ? '拖动图片到这里上传，或点击上传新图片' : 'Drag images here, or click to upload new images')}
                </p>
                <p className="mt-1 text-xs">
                  {language === 'zh'
                    ? `插入格式：![](${getNormalizedImageBaseUrl(imageBaseUrl)}图片名.png)`
                    : `Inserted format: ![](${getNormalizedImageBaseUrl(imageBaseUrl)}image-name.png)`}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={uploadImageToSourceImages} disabled={isUploadingImage || isLoading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingImage ? (language === 'zh' ? '上传中...' : 'Uploading...') : (language === 'zh' ? '上传新图片' : 'Upload New Image')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => loadImageFiles(hexoPath)} disabled={isUploadingImage || isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '刷新列表' : 'Refresh List'}
                  </Button>
                </div>
              </div>

              {renderImageArticleFilterControls()}

              {uploadedImages.length > 0 ? (
                visibleUploadedImages.length > 0 ? (
                  imageViewMode === 'list' ? (
                    <div className="max-h-[52vh] overflow-auto rounded-lg border">
                      {visibleUploadedImages.map((image) => (
                        <div
                          key={image.path}
                          className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted"
                        >
                          <span className="flex min-w-[300px] flex-1 items-center gap-2">
                            <Image className="h-4 w-4 flex-shrink-0 text-blue-600" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{image.name}</span>
                              <span className="block text-xs text-muted-foreground">{formatUploadedImageSize(image.size)}</span>
                              <span className="mt-1 block text-[10px] text-muted-foreground">
                                {getImageArticleTag(image.name)
                                  ? (language === 'zh' ? `文章：${getImageArticleTag(image.name)}` : `Post: ${getImageArticleTag(image.name)}`)
                                  : (language === 'zh' ? '未关联文章' : 'No linked post')}
                              </span>
                            </span>
                          </span>
                          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1">
                            {renderImageArticleTagSelect(image)}
                            <span className="hidden max-w-80 truncate text-xs text-muted-foreground lg:inline">
                              ![]({getImageReferenceUrl(image.name)})
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => insertImageReference(image.name)}
                            >
                              {language === 'zh' ? '引用' : 'Insert'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => renameUploadedImage(image)}
                              title={language === 'zh' ? '重命名图片' : 'Rename image'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteUploadedImage(image)}
                              title={language === 'zh' ? '删除图片' : 'Delete image'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid max-h-[52vh] grid-cols-2 gap-4 overflow-auto pr-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      {visibleUploadedImages.map((image) => (
                        <div
                          key={image.path}
                          className="min-w-0 rounded-xl border p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                          title={`![](${getImageReferenceUrl(image.name)})`}
                        >
                          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                            <Image className="h-8 w-8" />
                          </div>
                          <div className="truncate text-xs font-medium">{image.name}</div>
                          <div className="mt-1 text-[10px] text-muted-foreground">{formatUploadedImageSize(image.size)}</div>
                          <div className="mt-2 flex justify-center">
                            {renderImageArticleTagSelect(image, true)}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => insertImageReference(image.name)}
                            >
                              {language === 'zh' ? '引用' : 'Insert'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => renameUploadedImage(image)}
                              title={language === 'zh' ? '重命名图片' : 'Rename image'}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteUploadedImage(image)}
                              title={language === 'zh' ? '删除图片' : 'Delete image'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  renderNoVisibleUploadedImages()
                )
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <Image className="mb-3 h-10 w-10" />
                  <p className="text-sm">{language === 'zh' ? 'source/images 目录下暂无图片' : 'No images found under source/images'}</p>
                  <p className="mt-1 text-xs">{language === 'zh' ? '请先拖动或上传图片后再引用。' : 'Drag or upload an image before inserting a reference.'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImagePickerDialog(false)}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI分析对话框 */}
      <AIAnalysisDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        aiProvider={aiProvider}
        apiKey={apiKey}
        analysisPrompt={analysisPrompt}
        language={language}
        tagsData={allTagsForCloud}
        publishStatsData={publishStatsData}
        openaiModel={openaiModel}
        openaiApiEndpoint={openaiApiEndpoint}
        openaiApiPath={openaiApiPath}
      />

      {/* 删除文章确认对话框 */}
      <Dialog open={showDeletePostDialog} onOpenChange={setShowDeletePostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDelete}</DialogTitle>
            <DialogDescription>
              确定要删除文章 "{selectedPost?.name.replace(/\.(md|markdown)$/, '') || '当前文章'}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePostDialog(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowDeletePostDialog(false);
              deletePost();
            }}>
              {t.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}