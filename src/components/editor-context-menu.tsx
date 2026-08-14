'use client';

import React, { useState } from 'react';
import {
  Menu,
  Item,
  Separator,
  Submenu,
  useContextMenu
} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { 
  Wand2, Languages, FileText, Sparkles, BookOpen,
  Copy, Scissors, Clipboard, SquareStack,
  Bold, Italic, Code, Link2, List, ListOrdered
} from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { AIRewriteDialog } from '@/components/ai-rewrite-dialog';
import { AIDeepImitationDialog } from '@/components/ai-deep-imitation-dialog';

interface Post {
  name: string;
  path: string;
  modifiedTime?: Date;
}

interface EditorContextMenuProps {
  children: React.ReactNode;
  className?: string;
  selectedText: string;
  onRewrite: (rewrittenText: string) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onFormat: (format: string) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
  enableAI?: boolean;
  posts?: Post[];
  hexoPath?: string;
  currentContent?: string;
}

const MENU_ID = 'editor-context-menu';

export function EditorContextMenu({
  children,
  className,
  selectedText,
  onRewrite,
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onFormat,
  aiProvider,
  apiKey,
  language,
  openaiModel = 'gpt-3.5-turbo',
  openaiApiEndpoint = 'https://api.openai.com/v1',
  openaiApiPath = '/chat/completions',
  enableAI = false,
  posts = [],
  hexoPath = '',
  currentContent = ''
}: EditorContextMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rewriteType, setRewriteType] = useState<'rewrite' | 'improve' | 'translate' | 'expand' | null>(null);
  const [deepImitationDialogOpen, setDeepImitationDialogOpen] = useState(false);
  const t = getTexts(language);
  const { show } = useContextMenu({ id: MENU_ID });

  const hasSelection = selectedText && selectedText.trim().length > 0;
  const canUseAI = enableAI && apiKey;

  const openRewriteDialog = (type: 'rewrite' | 'improve' | 'translate' | 'expand') => {
    setRewriteType(type);
    setDialogOpen(true);
  };

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
    <div className={className}>
      <div className="h-full w-full" onContextMenu={handleContextMenu}>
        {children}
      </div>

      <Menu id={MENU_ID} className="context-menu">
        {/* AI功能区 */}
        {enableAI && (
          <React.Fragment key="ai-tools">
            <Submenu
              label={
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  {language === 'zh' ? 'AI 工具' : 'AI Tools'}
                </div>
              }
            >
              {enableAI && apiKey ? (
                <React.Fragment key="ai-submenu-items">
                  {hasSelection ? (
                    <>
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
                    </>
                  ) : (
                    <Item disabled>
                      {t.pleaseSelectText}
                    </Item>
                  )}
                  <Item onClick={() => setDeepImitationDialogOpen(true)}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {language === 'zh' ? '深度模仿' : 'Deep Imitation'}
                    </div>
                  </Item>
                </React.Fragment>
              ) : (
                <Item disabled>
                  {!apiKey ? t.pleaseConfigureApiKey : t.pleaseSelectText}
                </Item>
              )}
            </Submenu>
            <Separator />
          </React.Fragment>
        )}

        {/* 编辑功能区 */}
        <Item onClick={onCopy} disabled={!hasSelection}>
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            {language === 'zh' ? '复制' : 'Copy'}
          </div>
        </Item>
        <Item onClick={onCut} disabled={!hasSelection}>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            {language === 'zh' ? '剪切' : 'Cut'}
          </div>
        </Item>
        <Item onClick={onPaste}>
          <div className="flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            {language === 'zh' ? '粘贴' : 'Paste'}
          </div>
        </Item>
        <Item onClick={onSelectAll}>
          <div className="flex items-center gap-2">
            <SquareStack className="w-4 h-4" />
            {language === 'zh' ? '全选' : 'Select All'}
          </div>
        </Item>

        <Separator />

        {/* Markdown 格式化 */}
        <Submenu
          label={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {language === 'zh' ? 'Markdown 格式' : 'Markdown Format'}
            </div>
          }
          disabled={!hasSelection}
        >
          <Item onClick={() => onFormat('bold')}>
            <div className="flex items-center gap-2">
              <Bold className="w-4 h-4" />
              {language === 'zh' ? '粗体' : 'Bold'}
            </div>
          </Item>
          <Item onClick={() => onFormat('italic')}>
            <div className="flex items-center gap-2">
              <Italic className="w-4 h-4" />
              {language === 'zh' ? '斜体' : 'Italic'}
            </div>
          </Item>
          <Item onClick={() => onFormat('code')}>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              {language === 'zh' ? '行内代码' : 'Inline Code'}
            </div>
          </Item>
          <Item onClick={() => onFormat('link')}>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {language === 'zh' ? '链接' : 'Link'}
            </div>
          </Item>
          <Separator />
          <Item onClick={() => onFormat('ul')}>
            <div className="flex items-center gap-2">
              <List className="w-4 h-4" />
              {language === 'zh' ? '无序列表' : 'Unordered List'}
            </div>
          </Item>
          <Item onClick={() => onFormat('ol')}>
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              {language === 'zh' ? '有序列表' : 'Ordered List'}
            </div>
          </Item>
        </Submenu>
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
