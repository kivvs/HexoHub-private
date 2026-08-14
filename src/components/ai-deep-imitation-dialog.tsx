
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Copy, Check, RefreshCw, BookOpen } from 'lucide-react';
import { getTexts } from '@/utils/i18n';
import { isTauri } from '@/lib/desktop-api';
import { buildAiApiUrl } from '@/lib/utils';

interface Post {
  name: string;
  path: string;
  modifiedTime?: Date;
}

interface AIDeepImitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentContent: string;
  hexoPath: string;
  allPosts: Post[];
  onAccept: (generatedContent: string) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
}

export function AIDeepImitationDialog({
  open,
  onOpenChange,
  currentContent,
  hexoPath,
  allPosts,
  onAccept,
  aiProvider,
  apiKey,
  language,
  openaiModel = 'gpt-3.5-turbo',
  openaiApiEndpoint = 'https://api.openai.com/v1',
  openaiApiPath = '/chat/completions'
}: AIDeepImitationDialogProps) {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const t = getTexts(language);

  // 获取当前文章标题
  const extractTitleFromContent = (content: string) => {
    // 尝试从front matter中获取标题
    const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const titleMatch = frontMatter.match(/^title:\s*(.+)$/m);
      if (titleMatch) {
        return titleMatch[1].replace(/^["']|["']$/g, ''); // 去除引号
      }
    }

    // 如果没有找到标题，尝试从文件名获取（如果文件名可用）
    // 这里只是返回一个空字符串，实际应该从selectedPost.name获取
    return '';
  };

  // 对话框打开时初始化
  useEffect(() => {
    if (open) {
      const extractedTitle = extractTitleFromContent(currentContent);
      setTitle(extractedTitle);
      setSelectedPosts([]);
      setGeneratedContent('');
      setDisplayedContent('');
      setSelectAll(false);
    }
  }, [open, currentContent]);

  // 全选/全不选
  useEffect(() => {
    if (selectAll) {
      setSelectedPosts(allPosts.map(post => post.path));
    } else {
      setSelectedPosts([]);
    }
  }, [selectAll, allPosts]);

  // 处理单个文章选择
  const handlePostToggle = (postPath: string) => {
    setSelectedPosts(prev => {
      if (prev.includes(postPath)) {
        return prev.filter(path => path !== postPath);
      } else {
        return [...prev, postPath];
      }
    });
  };

  // AI生成函数
  const performGeneration = async () => {
    if (!apiKey || !title || !content || selectedPosts.length === 0) {
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');
    setDisplayedContent('');

    try {
      // 获取所选文章的内容
      const { getIpcRenderer } = await import('@/lib/desktop-api');
      const ipcRenderer = await getIpcRenderer();

      const referenceContents: string[] = [];
      for (const postPath of selectedPosts) {
        try {
          const postContent = await ipcRenderer.invoke('read-file', postPath);
          referenceContents.push(postContent);
        } catch (error) {
          console.error(`读取文章 ${postPath} 失败:`, error);
        }
      }

      // 构建提示词
      const referenceText = referenceContents.join('\\n---\\n');
;

      const userPrompt = language === 'zh'
        ? `请学习以下参考文章的写作风格、惯用词、语法逻辑习惯等，然后根据我提供的标题和大致内容，生成一篇完整的文章。

标题：${title}

大致内容：${content}

参考文章：
${referenceText}

请保持与参考文章相似的写作风格，但内容要基于我提供的标题和大致内容。只输出生成的文章，不要添加任何解释或说明。`
        : `Please learn the writing style, common vocabulary, and grammatical logic habits from the following reference articles, and then generate a complete article based on the title and general content I provide.

Title: ${title}

General Content: ${content}

Reference Articles:
${referenceText}

Please maintain a writing style similar to the reference articles, but the content should be based on the title and general content I provide. Only output the generated article, no explanations.`;

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
        max_tokens: 4000, // 增加token限制，因为需要生成完整的文章
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
                setDisplayedContent(accumulatedText);
                setGeneratedContent(accumulatedText);
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
      console.error('Error generating content:', error);
      const errorMessage = language === 'zh' ? '生成内容时出错，请重试' : 'Error generating content, please try again';
      setGeneratedContent(errorMessage);
      setDisplayedContent(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 接受生成结果
  const handleAccept = () => {
    onAccept(generatedContent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(95vw,1300px)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden bg-white dark:bg-gray-800" style={{backgroundColor: "var(--background)", opacity: 1}}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {language === 'zh' ? 'AI 深度模仿' : 'AI Deep Imitation'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto lg:grid-cols-2 lg:gap-6">
          {/* 左侧：输入参数 */}
          <div className="min-w-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                {language === 'zh' ? '标题' : 'Title'}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'zh' ? '请输入文章标题' : 'Enter article title'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-semibold">
                {language === 'zh' ? '大致内容' : 'General Content'}
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={language === 'zh' ? '请输入文章的大致内容或要点' : 'Enter the general content or key points of the article'}
                className="min-h-[150px] resize-none bg-gray-50 dark:bg-gray-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {language === 'zh' ? '选择参考文章' : 'Select Reference Articles'}
                  <span className="text-xs font-normal ml-2 text-gray-500">
                    ({selectedPosts.length} {language === 'zh' ? '已选' : 'selected'})
                  </span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => setSelectAll(checked as boolean)}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    {language === 'zh' ? '全选' : 'Select All'}
                  </Label>
                </div>
              </div>
              <ScrollArea className="h-[250px] w-full border rounded-md p-2">
                <div className="space-y-2">
                  {allPosts.map(post => (
                    <div key={post.path} className="flex items-center space-x-2">
                      <Checkbox
                        id={`post-${post.path}`}
                        checked={selectedPosts.includes(post.path)}
                        onCheckedChange={() => handlePostToggle(post.path)}
                      />
                      <Label htmlFor={`post-${post.path}`} className="text-sm cursor-pointer flex-1">
                        {post.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

          </div>

          {/* 右侧：生成结果 */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {language === 'zh' ? '生成结果' : 'Generated Result'}
              </Label>
              {displayedContent && !isGenerating && (
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
                value={displayedContent}
                readOnly
                className={`min-h-[260px] max-h-[45vh] resize-none transition-all duration-300 lg:min-h-[420px] ${
                  isGenerating 
                    ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-400/50 dark:ring-blue-600/50' 
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
                placeholder={
                  isGenerating
                    ? language === 'zh'
                      ? 'AI 正在生成文章...'
                      : 'AI is generating article...'
                    : language === 'zh'
                    ? '生成的文章将显示在这里'
                    : 'Generated article will be displayed here'
                }
              />
              {isGenerating && (
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t px-2 pt-4 sm:px-6">
          <Button
            onClick={performGeneration}
            disabled={isGenerating || !title || !content || selectedPosts.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'zh' ? '生成中...' : 'Generating...'}
              </>
            ) : (
              language === 'zh' ? '生成文章' : 'Generate Article'
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isGenerating || !generatedContent}
            >
              {language === 'zh' ? '接受生成结果' : 'Accept Generated Result'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
