
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { isTauri } from '@/lib/desktop-api';
import { buildAiApiUrl } from '@/lib/utils';

interface AIInspirationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  prompt: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
}

export function AIInspirationDialog({ open, onOpenChange, aiProvider, apiKey, prompt, language, openaiModel = 'gpt-3.5-turbo', openaiApiEndpoint = 'https://api.openai.com/v1', openaiApiPath = '/chat/completions' }: AIInspirationDialogProps) {
  const [inspiration, setInspiration] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const t = getTexts(language);
  // 可编辑的提示词（仅本次对话框内有效，不保存到设置）
  const [editablePrompt, setEditablePrompt] = useState<string>(prompt);
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(false);

  // 外部 prompt 变化时同步到本地可编辑值（对话框未打开时）
  useEffect(() => {
    if (!open) {
      setEditablePrompt(prompt);
    }
  }, [prompt, open]);

  // 生成AI灵感
  const generateInspiration = async () => {
    if (!apiKey || !editablePrompt) return;

    setIsGenerating(true);
    setInspiration('');
    setDisplayedText('');
    setIsTyping(false);

    try {
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

      const requestBody = JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: editablePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      // 调用AI API - 在 Tauri 环境下使用 Tauri HTTP 插件
      let response;
      if (isTauri()) {
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
        response = await tauriFetch(apiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        });
      } else {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        });
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (content) {
        setInspiration(content);
        setIsTyping(true);
      }
    } catch (error) {
      console.error('Error generating inspiration:', error);
      setInspiration(language === 'zh' 
        ? '生成灵感时出现错误，请检查API密钥是否正确。' 
        : 'An error occurred while generating inspiration, please check if the API key is correct.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 打字机效果
  useEffect(() => {
    if (isTyping && inspiration) {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }

      if (displayedText.length < inspiration.length) {
        typingRef.current = setTimeout(() => {
          setDisplayedText(inspiration.substring(0, displayedText.length + 1));
        }, 20);
      } else {
        setIsTyping(false);
      }
    }

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [isTyping, inspiration, displayedText]);

  // 对话框打开时自动生成灵感
  useEffect(() => {
    if (open) {
      generateInspiration();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            {t.aiInspiration}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t.inspiration}</Label>
              {isGenerating && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {t.generatingInspiration}
                </div>
              )}
            </div>
            <Textarea
              value={displayedText}
              readOnly
              className="min-h-[200px] resize-none"
              placeholder={t.aiInspirationDescription}
            />
          </div>

          {/* 可折叠的提示词编辑区（仅本次有效，不保存到设置） */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPromptEditor ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronUp className="w-4 h-4 mr-1" />}
              {language === 'zh' ? '编辑提示词（仅本次有效）' : 'Edit prompt (this session only)'}
            </button>

            {showPromptEditor && (
              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                <Textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder={t.promptPlaceholder}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {language === 'zh'
                      ? '修改后点击"重新生成"即可使用新提示词，不会保存到设置'
                      : 'Click "Get Inspiration" to use the new prompt. Changes will not be saved to settings.'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setEditablePrompt(prompt)}
                  >
                    {language === 'zh' ? '恢复默认' : 'Reset'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={generateInspiration}
              disabled={isGenerating || !apiKey}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.generatingInspiration}
                </>
              ) : (
                t.getInspiration
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
