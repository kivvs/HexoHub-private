'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Stethoscope, RefreshCw, Copy, Check } from 'lucide-react';
import { isTauri } from '@/lib/desktop-api';
import { buildAiApiUrl } from '@/lib/utils';
import { getSystemInfo } from '@/lib/system-info';

interface AIDiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProvider: 'deepseek' | 'openai' | 'siliconflow';
  apiKey: string;
  language: 'zh' | 'en';
  openaiModel?: string;
  openaiApiEndpoint?: string;
  openaiApiPath?: string;
  /** 附加诊断上下文（可选）：如 hexoPath、当前主题、最近错误等 */
  contextText?: string;
}

export function AIDiagnosticDialog({
  open,
  onOpenChange,
  aiProvider,
  apiKey,
  language,
  openaiModel = 'gpt-3.5-turbo',
  openaiApiEndpoint = 'https://api.openai.com/v1',
  openaiApiPath = '/chat/completions',
  contextText = '',
}: AIDiagnosticDialogProps) {
  const zh = language === 'zh';
  const [problem, setProblem] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const [hasCollectedInfo, setHasCollectedInfo] = useState<boolean>(false);

  // 收集系统/软件诊断上下文（打开时自动收集一次）
  const collectDiagnosticContext = async () => {
    if (hasCollectedInfo) return;
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('收集系统信息失败:', error);
      setSystemInfo(zh ? '系统信息获取失败' : 'Failed to collect system info');
    }
    setHasCollectedInfo(true);
  };

  useEffect(() => {
    if (open && !hasCollectedInfo) {
      collectDiagnosticContext();
    }
  }, [open]);

  const runDiagnosis = async () => {
    if (!apiKey) return;

    setIsDiagnosing(true);
    setDiagnosis('');
    setDisplayedText('');
    setIsTyping(false);

    // 组装诊断上下文
    const contextParts: string[] = [];
    contextParts.push(`【软件/系统环境】\n${systemInfo}`);
    if (contextText) {
      contextParts.push(`【项目/运行上下文】\n${contextText}`);
    }
    contextParts.push(
      zh
        ? `【用户描述的问题】\n${problem}`
        : `【User's problem description】\n${problem}`
    );
    const fullContext = contextParts.join('\n\n');

    const systemPrompt = zh
      ? `你是一名专业的 HexoHub 桌面软件技术支持工程师。请根据用户提供的【软件/系统环境】、【项目/运行上下文】和【用户描述的问题】，完成以下任务：
1. 分析问题的可能原因（分点列出，简明扼要）；
2. 给出具体、可操作的解决步骤（步骤清晰，包含要点击的界面按钮或执行的命令）；
3. 如果信息不足，明确指出还需要哪些信息。
请使用中文回答。`
      : `You are a professional support engineer for the HexoHub desktop app. Based on the provided environment, project context, and the user's problem description:
1. Analyze possible causes (concise bullet points);
2. Provide concrete, actionable steps (clear steps with UI buttons or commands to run);
3. If information is insufficient, state what additional info is needed.
Answer in English.`;

    try {
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
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullContext },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      });

      const requestHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      let response;
      if (isTauri()) {
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
        response = await tauriFetch(apiUrl, { method: 'POST', headers: requestHeaders, body: requestBody });
      } else {
        response = await fetch(apiUrl, { method: 'POST', headers: requestHeaders, body: requestBody });
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) {
        setDiagnosis(content);
        setIsTyping(true);
      }
    } catch (error) {
      console.error('AI 诊断失败:', error);
      setDiagnosis(
        zh
          ? '诊断失败，请检查 API 密钥或网络连接是否正常。'
          : 'Diagnosis failed. Please check your API key or network connection.'
      );
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 打字机效果
  useEffect(() => {
    if (isTyping && diagnosis) {
      if (typingRef.current) clearTimeout(typingRef.current);
      if (displayedText.length < diagnosis.length) {
        typingRef.current = setTimeout(() => {
          setDisplayedText(diagnosis.substring(0, displayedText.length + 4));
        }, 15);
      } else {
        setIsTyping(false);
      }
    }
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [isTyping, diagnosis, displayedText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnosis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = diagnosis;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
            {zh ? 'AI 辅助诊断' : 'AI Assistant Diagnosis'}
          </DialogTitle>
          <DialogDescription>
            {zh
              ? '描述您遇到的软件问题，AI 将结合软件/系统环境与运行上下文分析原因并给出解决步骤。'
              : 'Describe the problem you encountered; the AI will analyze causes and suggest fixes using environment and context.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{zh ? '问题描述' : 'Problem Description'}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={collectDiagnosticContext}
                disabled={hasCollectedInfo}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                {zh ? '收集环境信息' : 'Collect Env Info'}
              </Button>
            </div>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={4}
              placeholder={
                zh
                  ? '例如：切换博客主题后页面变成纯白色，或者图片提取失败、部署报错等...'
                  : 'e.g. Blog becomes a blank white page after switching themes, image extraction failed, deployment error...'
              }
            />
          </div>

          {/* 诊断上下文（可折叠展示） */}
          {systemInfo && (
            <details className="rounded-lg border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                {zh ? '已收集的诊断上下文（点击展开）' : 'Collected diagnostic context (click to expand)'}
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-background p-2 font-mono text-[11px] text-foreground">
                {systemInfo}
                {contextText ? `\n\n${contextText}` : ''}
              </pre>
            </details>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={runDiagnosis} disabled={!apiKey || isDiagnosing || !problem.trim()}>
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {zh ? '诊断中...' : 'Diagnosing...'}
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4 mr-2" />
                  {zh ? '开始诊断' : 'Diagnose'}
                </>
              )}
            </Button>
            {diagnosis && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? (zh ? '已复制' : 'Copied') : (zh ? '复制结果' : 'Copy')}
              </Button>
            )}
          </div>

          {diagnosis && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{zh ? '诊断结果与解决方案' : 'Diagnosis & Solution'}</Label>
                {isTyping && (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    {zh ? '输出中...' : 'Typing...'}
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-sm leading-7 whitespace-pre-wrap break-words max-h-[45vh] overflow-y-auto">
                {displayedText}
                {isTyping && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
