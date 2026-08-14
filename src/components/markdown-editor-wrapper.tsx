import { getDesktopEnvironment } from '@/lib/desktop-api';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownEditorElectron } from './markdown-editor-electron';

interface Post {
  name: string;
  path: string;
  modifiedTime?: Date;
}

interface MarkdownEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  isLoading?: boolean;
  language?: 'zh' | 'en';
  hexoPath?: string;
  selectedPost?: Post | null;
  posts?: Post[];
  // AI 配置
  enableAI?: boolean;
  aiProvider?: 'deepseek' | 'openai' | 'siliconflow';
  apiKey?: string;
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
}

// 根据环境自动选择合适的编辑器组件
export function MarkdownEditorWrapper(props: MarkdownEditorWrapperProps) {
  const env = getDesktopEnvironment();

  // 如果是 Electron 环境，使用 Electron 专用版本
  if (env === 'electron') {
    return <MarkdownEditorElectron {...props} />;
  }

  // 其他环境（Tauri 或浏览器）使用原始版本
  return <MarkdownEditor {...props} />;
}
