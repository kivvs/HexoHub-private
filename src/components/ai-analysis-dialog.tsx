'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart3, X } from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { isTauri } from '@/lib/desktop-api';
import { buildAiApiUrl } from '@/lib/utils';

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  analysisPrompt: string;
  language: 'zh' | 'en';
  tagsData: string[];
  publishStatsData: any[];
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
}

export function AIAnalysisDialog({ open, onOpenChange, aiProvider, apiKey, analysisPrompt, language, tagsData, publishStatsData, openaiModel = 'gpt-3.5-turbo', openaiApiEndpoint = 'https://api.openai.com/v1', openaiApiPath = '/chat/completions' }: AIAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const t = getTexts(language);

  // 生成AI分析
  const generateAnalysis = async () => {
    if (!apiKey || !analysisPrompt) return;

    setIsGenerating(true);
    setAnalysis('');
    setDisplayedText('');
    setIsTyping(false);

    try {
      // 准备数据内容
      const tagsContent = tagsData.length > 0 
        ? `标签数据：共有${tagsData.length}个不同标签，${tagsData.join('、')}等。` 
        : '暂无标签数据。';

      const statsContent = publishStatsData.length > 0
        ? `发布统计数据：${publishStatsData.map(item => `${item.month}月发布${item.count}篇文章`).join('，')}。`
        : '暂无发布统计数据。';

      const content = `${tagsContent}${statsContent}`;

      // 替换提示词中的{content}占位符
      const finalPrompt = analysisPrompt.replace('{content}', content);

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

      // 调用AI API - 在 Tauri 环境下使用 Tauri HTTP 插件
      let response;
      if (isTauri()) {
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
        response = await tauriFetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: finalPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });
      } else {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: finalPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content || '';

      if (result) {
        setAnalysis(result);
        setIsTyping(true);
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAnalysis(language === 'zh'
        ? '生成分析时出现错误，请检查API密钥是否正确。'
        : 'An error occurred while generating analysis, please check if the API key is correct.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 打字机效果
  useEffect(() => {
    if (isTyping && analysis) {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }

      if (displayedText.length < analysis.length) {
        typingRef.current = setTimeout(() => {
          setDisplayedText(analysis.substring(0, displayedText.length + 1));
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
  }, [isTyping, analysis, displayedText]);

  // 对话框打开时自动生成分析
  useEffect(() => {
    if (open) {
      generateAnalysis();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            {language === 'zh' ? '文章分析' : 'Article Analysis'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{language === 'zh' ? '分析结果' : 'Analysis Result'}</Label>
              {isGenerating && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {language === 'zh' ? '生成分析中...' : 'Generating analysis...'}
                </div>
              )}
            </div>
            <Textarea
              value={displayedText}
              readOnly
              className="min-h-[200px] resize-none"
              placeholder={language === 'zh' ? 'AI分析结果将显示在这里' : 'AI analysis results will be displayed here'}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === 'zh' ? '关闭' : 'Close'}
            </Button>
            <Button
              onClick={generateAnalysis}
              disabled={isGenerating || !apiKey}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'zh' ? '生成中...' : 'Generating...'}
                </>
              ) : (
                language === 'zh' ? '重新分析' : 'Re-analyze'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}