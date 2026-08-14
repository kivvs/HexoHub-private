'use client';

import React, { useState } from 'react';
import {
  Menu,
  Item,
  useContextMenu,
} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { Wand2, Languages, FileText, Sparkles, BookOpen } from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { AIRewriteDialog } from '@/components/ai-rewrite-dialog';
import { AIDeepImitationDialog } from '@/components/ai-deep-imitation-dialog';

interface Post {
  name: string;
  path: string;
  modifiedTime: Date;
}

interface AIRewriteMenuProps {
  children: React.ReactNode;
  selectedText: string;
  onRewrite: (rewrittenText: string) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
  enabled?: boolean;
  posts?: Post[];
  hexoPath?: string;
  currentContent?: string;
}

const MENU_ID = 'ai-rewrite-menu';

export function AIRewriteMenu({
  children,
  selectedText,
  onRewrite,
  aiProvider,
  apiKey,
  language,
  openaiModel = 'gpt-3.5-turbo',
  openaiApiEndpoint = 'https://api.openai.com/v1',
  openaiApiPath = '/chat/completions',
  enabled = true,
  posts = [],
  hexoPath = '',
  currentContent = ''
}: AIRewriteMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rewriteType, setRewriteType] = useState<'rewrite' | 'improve' | 'translate' | 'expand' | null>(null);
  const [deepImitationDialogOpen, setDeepImitationDialogOpen] = useState(false);
  const t = getTexts(language);
  const { show } = useContextMenu({ id: MENU_ID });

  // 打开 AI 改写对话框
  const openRewriteDialog = (type: 'rewrite' | 'improve' | 'translate' | 'expand') => {
    setRewriteType(type);
    setDialogOpen(true);
  };

  // 如果没有启用AI或没有选中文本，则不显示AI选项
  const hasSelection = selectedText && selectedText.trim().length > 0;
  const canUseAI = enabled && apiKey && hasSelection;

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    show({
      event,
      props: {
        selectedText,
        hasSelection,
        canUseAI
      }
    });
  };

  return (
    <div>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      <Menu id={MENU_ID} className="context-menu">
        {canUseAI ? (
          <React.Fragment key="ai-items">
            <Item onClick={() => openRewriteDialog('rewrite')}>
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                {t.aiRewrite}
              </div>
            </Item>
            <Item onClick={() => openRewriteDialog('improve')}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t.aiImprove}
              </div>
            </Item>
            <Item onClick={() => openRewriteDialog('expand')}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t.aiExpand}
              </div>
            </Item>
            <Item onClick={() => openRewriteDialog('translate')}>
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {t.aiTranslate}
              </div>
            </Item>
            <Item onClick={() => setDeepImitationDialogOpen(true)}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {language === 'zh' ? '深度模仿' : 'Deep Imitation'}
              </div>
            </Item>
          </React.Fragment>
        ) : (
          <Item disabled>
            {!enabled 
              ? t.aiFeatureNotEnabled
              : !apiKey
              ? t.pleaseConfigureApiKey
              : t.pleaseSelectText
            }
          </Item>
        )}
      </Menu>

      {/* AI 改写预览对话框 */}
      <AIRewriteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedText={selectedText}
        rewriteType={rewriteType}
        onAccept={onRewrite}
        aiProvider={aiProvider}
        apiKey={apiKey}
        language={language}
        openaiModel={openaiModel}
        openaiApiEndpoint={openaiApiEndpoint}
        openaiApiPath={openaiApiPath}
      />

      {/* AI 深度模仿对话框 */}
      <AIDeepImitationDialog
        open={deepImitationDialogOpen}
        onOpenChange={setDeepImitationDialogOpen}
        currentContent={currentContent}
        hexoPath={hexoPath}
        allPosts={posts}
        onAccept={onRewrite}
        aiProvider={aiProvider}
        apiKey={apiKey}
        language={language}
        openaiModel={openaiModel}
        openaiApiEndpoint={openaiApiEndpoint}
        openaiApiPath={openaiApiPath}
      />
    </div>
  );
}
