'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { isTauri } from '@/lib/desktop-api';
import { buildAiApiUrl } from '@/lib/utils';

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  rewriteType: 'rewrite' | 'improve' | 'translate' | 'expand' | null;
  onAccept: (rewrittenText: string) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
}

export function AIRewriteDialog({
  open,
  onOpenChange,
  selectedText,
  rewriteType,
  onAccept,
  aiProvider,
  apiKey,
  language,
  openaiModel = 'gpt-3.5-turbo',
  openaiApiEndpoint = 'https://api.openai.com/v1',
  openaiApiPath = '/chat/completions'
}: AIRewriteDialogProps) {
  const [rewrittenText, setRewrittenText] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const t = getTexts(language);

  // 获取重写类型的标题
  const getRewriteTitle = () => {
    switch (rewriteType) {
      case 'rewrite':
        return t.aiRewrite;
      case 'improve':
        return t.aiImprove;
      case 'expand':
        return t.aiExpand;
      case 'translate':
        return t.aiTranslate;
      default:
        return '';
    }
  };

  // AI重写函数 - 使用流式传输
  const performRewrite = async () => {
    if (!apiKey || !selectedText || !rewriteType) {
      return;
    }

    setIsRewriting(true);
    setRewrittenText('');
    setDisplayedText('');

    try {
      // 根据类型生成不同的提示词（优化版本，更简洁直接）
      let userPrompt = '';
      switch (rewriteType) {
        case 'rewrite':
          userPrompt = language === 'zh' 
            ? `请直接重写以下文本，使其更清晰流畅，保持原意。只输出改写后的文本，不要添加任何解释或说明：\n\n${selectedText}`
            : `Rewrite the following text to make it clearer and more fluent, while maintaining the original meaning. Only output the rewritten text, no explanations:\n\n${selectedText}`;
          break;
        case 'improve':
          userPrompt = language === 'zh'
            ? `请直接改进以下文本，使其更专业、生动。只输出改进后的文本，不要添加任何解释或说明：\n\n${selectedText}`
            : `Improve the following text to make it more professional and engaging. Only output the improved text, no explanations:\n\n${selectedText}`;
          break;
        case 'translate':
          userPrompt = language === 'zh'
            ? `请直接将以下文本翻译成英文。只输出翻译结果，不要添加任何解释或说明：\n\n${selectedText}`
            : `Translate the following text to Chinese. Only output the translation, no explanations:\n\n${selectedText}`;
          break;
        case 'expand':
          userPrompt = language === 'zh'
            ? `请扩展以下文本，适当添加细节。只输出扩展后的文本，不要添加解释或标注：\n\n${selectedText}`
            : `Expand the following text with appropriate details. Only output the expanded text, no explanations or annotations:\n\n${selectedText}`;
          break;
      }

      // 根据提供商选择API端点和模型
      const apiUrl = buildAiApiUrl(aiProvider, openaiApiEndpoint, openaiApiPath);
      let model: string;

      if (aiProvider === 'deepseek') {
        model = 'deepseek-chat';
      } else if (aiProvider === 'siliconflow') {
        model = openaiModel || 'Qwen/Qwen2.5-7B-Instruct';
      } else {
        model = openaiModel || 'gpt-3.5-turbo';
      }

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true // 启用流式传输
      };

      // 调用AI API - 流式传输
      let response;
      if (isTauri()) {
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
        response = await tauriFetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
      } else {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || '';
              
              if (content) {
                accumulatedText += content;
                setDisplayedText(accumulatedText);
                setRewrittenText(accumulatedText);
              }
            } catch (e) {
              // 忽略解析错误
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      if (!accumulatedText) {
        throw new Error('No content received from API');
      }

    } catch (error) {
      console.error('Error rewriting text:', error);
      const errorMessage = t.rewriteTextError;
      setRewrittenText(errorMessage);
      setDisplayedText(errorMessage);
    } finally {
      setIsRewriting(false);
    }
  };

  // 打字机效果已被流式传输取代，不再需要模拟
  // 流式传输会实时更新 displayedText

  // 对话框打开时自动生成
  useEffect(() => {
    if (open && rewriteType) {
      performRewrite();
    }
  }, [open, rewriteType]);

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 接受改写结果
  const handleAccept = () => {
    onAccept(rewrittenText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(95vw,1300px)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden bg-white dark:bg-gray-800" style={{backgroundColor: "var(--background)", opacity: 1}}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getRewriteTitle()}</span>
            {!isRewriting && rewrittenText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={performRewrite}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {language === 'zh' ? '重新生成' : 'Regenerate'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto lg:grid-cols-2 lg:gap-6">
          {/* 原文 */}
          <div className="min-w-0 space-y-2">
            <Label className="text-sm font-semibold">
              {language === 'zh' ? '原文' : 'Original'}
            </Label>
            <Textarea
              value={selectedText}
              readOnly
              className="min-h-[260px] max-h-[45vh] resize-none bg-gray-50 dark:bg-gray-900 lg:min-h-[420px]"
            />
          </div>

          {/* AI 改写结果 */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {language === 'zh' ? 'AI 改写结果' : 'AI Rewrite Result'}
              </Label>
              {displayedText && !isRewriting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-7 px-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '已复制' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '复制' : 'Copy'}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="relative">
              <Textarea
                value={displayedText}
                readOnly
                className={`min-h-[260px] max-h-[45vh] resize-none transition-all duration-300 lg:min-h-[420px] ${
                  isRewriting 
                    ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-400/50 dark:ring-blue-600/50' 
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
                placeholder={
                  isRewriting
                    ? language === 'zh'
                      ? 'AI 正在生成改写结果...'
                      : 'AI is generating rewrite result...'
                    : language === 'zh'
                    ? 'AI 改写结果将显示在这里'
                    : 'AI rewrite result will be displayed here'
                }
              />
              {isRewriting && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-blue-100/90 dark:bg-blue-900/90 px-3 py-1.5 rounded-md shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {language === 'zh' ? '生成中...' : 'Generating...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isRewriting || !rewrittenText || rewrittenText === t.rewriteTextError}
          >
            {language === 'zh' ? '接受改写' : 'Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

