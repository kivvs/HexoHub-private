'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { isTauri, isElectron } from '@/lib/desktop-api';
import { fetchGiscusEmbedConfig, type GiscusEmbedConfig } from '@/lib/analytics-data';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  previewMode?: 'static' | 'server';
  hexoPath?: string;
  selectedPost?: any;
  isServerRunning?: boolean;
  onStartServer?: () => void;
  forceRefresh?: boolean;
  onForceRefreshComplete?: () => void;
  iframeUrlMode?: 'hexo' | 'root';
  giscusRepo?: string;
  giscusCategory?: string;
  giscusToken?: string;
  language?: 'zh' | 'en';
}

interface GiscusCommentsProps {
  repo?: string;
  category?: string;
  token?: string;
  term: string;
  language: 'zh' | 'en';
}

function GiscusComments({ repo = '', category = '', token = '', term, language }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedConfig, setEmbedConfig] = useState<GiscusEmbedConfig | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'not-configured'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      if (!repo.trim() || !token.trim()) {
        setStatus('not-configured');
        setEmbedConfig(null);
        return;
      }

      setStatus('loading');
      setError('');

      try {
        const config = await fetchGiscusEmbedConfig({ repo, category, token });
        if (!cancelled) {
          setEmbedConfig(config);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
          setEmbedConfig(null);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [repo, category, token]);

  useEffect(() => {
    if (!containerRef.current || status !== 'ready' || !embedConfig) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', embedConfig.repo);
    script.setAttribute('data-repo-id', embedConfig.repoId);
    script.setAttribute('data-category', embedConfig.category);
    script.setAttribute('data-category-id', embedConfig.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', term || 'HexoHub Preview');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', language === 'zh' ? 'zh-CN' : 'en');
    script.setAttribute('data-loading', 'lazy');

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [embedConfig, status, term, language]);

  if (status === 'not-configured') {
    return null;
  }

  return (
    <section className="mt-10 rounded-2xl border border-blue-100/80 bg-white/80 p-5 shadow-sm dark:border-blue-900/60 dark:bg-slate-950/80">
      <div className="mb-4 border-b border-dashed border-blue-200 pb-3 dark:border-blue-900/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {language === 'zh' ? '评论' : 'Comments'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === 'zh' ? '由 Giscus / GitHub Discussions 提供支持' : 'Powered by Giscus / GitHub Discussions'}
        </p>
      </div>

      {status === 'loading' ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {language === 'zh' ? '正在加载评论框...' : 'Loading comments...'}
        </div>
      ) : status === 'error' ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {language === 'zh' ? '评论框加载失败：' : 'Failed to load comments: '}{error}
        </div>
      ) : (
        <div ref={containerRef} className="giscus min-h-24" />
      )}
    </section>
  );
}

export function MarkdownPreview({ content, className = '', previewMode = 'static', hexoPath, selectedPost, isServerRunning = false, onStartServer, forceRefresh = false, onForceRefreshComplete, iframeUrlMode = 'hexo', giscusRepo = '', giscusCategory = '', giscusToken = '', language = 'zh' }: MarkdownPreviewProps) {
  // 移除front matter
  const processedContent = content.replace(/^---\s*[\s\S]*?---\s*/, '');
  
  // 创建iframe引用
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 提取postUrl
  let postUrl = '';
  if (previewMode === 'server' && selectedPost) {
    // 从文件名中提取文章标题（不含扩展名）
    const postTitle = selectedPost.name.replace(/\.md$|\.markdown$/, '');
    
    // 提取日期前缀（如果文件名以YYYY-MM-DD格式开头）
    const dateMatch = postTitle.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    
    if (dateMatch) {
      // 如果有日期前缀，使用年/月/日/文章名的路径结构
      const year = dateMatch[1].substring(0, 4);
      const month = dateMatch[1].substring(5, 7);
      const day = dateMatch[1].substring(8, 10);
      // 直接使用原始标题，不进行任何编码或解码
      const title = dateMatch[2];
      // 确保URL以斜杠结尾，这是Hexo的默认格式
      postUrl = `${year}/${month}/${day}/${title}/`;
    } else {
      // 如果没有日期前缀，尝试从front matter中提取日期
      // 从文章内容中提取front matter
      const frontMatterMatch = content.match(/^---\s*[\s\S]*?---\s*/);
      let postDate: string | null = null;
      
      if (frontMatterMatch) {
        // 尝试从front matter中提取date字段
        const dateFieldMatch = frontMatterMatch[0].match(/date:\s*(.+)/i);
        if (dateFieldMatch) {
          // 尝试解析日期
          const dateStr = dateFieldMatch[1].trim();
          // 尝试匹配YYYY-MM-DD格式
          const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            postDate = dateMatch[1];
          }
        }
      }
      
      if (postDate) {
        // 如果找到了日期，使用它
        const year = postDate.substring(0, 4);
        const month = postDate.substring(5, 7);
        const day = postDate.substring(8, 10);
        postUrl = `${year}/${month}/${day}/${postTitle}/`;
      } else {
        // 如果没有找到日期，使用文件创建日期（如果可用）或当前日期
        // 注意：在浏览器环境中，我们无法直接获取文件创建日期
        // 这里使用当前日期作为后备方案
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        postUrl = `${year}/${month}/${day}/${postTitle}/`;
      }
    }
  }
  
  // 监听forceRefresh变化，强制刷新iframe
  useEffect(() => {
    if (forceRefresh && previewMode === 'server' && iframeRef.current) {
      // 强制刷新iframe，模拟Ctrl+F5
      const iframe = iframeRef.current;
      const isTauriEnv = isTauri();
      const isElectronEnv = isElectron();
      
      // 根据iframeUrlMode决定使用哪种地址
      const targetUrl = iframeUrlMode === 'root' ? 'http://localhost:4000' : `http://localhost:4000/${postUrl}`;
      
      if (isTauriEnv) {
        // Tauri环境：直接使用src切换
        iframe.src = 'about:blank';
        setTimeout(() => {
          // 添加时间戳参数强制刷新
          iframe.src = `${targetUrl}?t=${Date.now()}`;
          if (onForceRefreshComplete) {
            onForceRefreshComplete();
          }
        }, 1500);
      } else if (isElectronEnv) {
        // Electron环境：使用srcDoc方式刷新
        iframe.src = 'about:blank';
        setTimeout(() => {
          iframe.srcdoc = `
            <html>
              <head>
                <meta http-equiv="refresh" content="0; url=${targetUrl}?t=${Date.now()}" />
                <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
                <meta http-equiv="Pragma" content="no-cache" />
                <meta http-equiv="Expires" content="0" />
              </head>
              <body>
                <p>正在刷新预览...</p>
              </body>
            </html>
          `;
          if (onForceRefreshComplete) {
            onForceRefreshComplete();
          }
        }, 1500);
      } else {
        // 浏览器环境：直接刷新
        iframe.src = 'about:blank';
        setTimeout(() => {
          iframe.src = `${targetUrl}?t=${Date.now()}`;
          if (onForceRefreshComplete) {
            onForceRefreshComplete();
          }
        }, 1500);
      }
    }
  }, [forceRefresh, previewMode, postUrl, onForceRefreshComplete, iframeUrlMode]);

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-xl border border-slate-700/60 text-sm shadow-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-900/70" {...props}>
          {children}
        </code>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="my-5 rounded-r-xl border-l-4 border-blue-500 bg-blue-50/80 px-4 py-3 italic text-slate-700 shadow-sm dark:bg-blue-950/30 dark:text-slate-300">
          {children}
        </blockquote>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="min-w-full border-collapse bg-background">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="border-b border-r border-border bg-blue-50 px-4 py-2 text-left font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="border-b border-r border-border px-4 py-2 text-foreground">
          {children}
        </td>
      );
    },
    h1({ children }: any) {
      return (
        <h1 className="mt-2 mb-6 border-b-2 border-blue-200 pb-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:border-blue-900/70 dark:text-slate-50">
          {children}
        </h1>
      );
    },
    h2({ children }: any) {
      return (
        <h2 className="mt-8 mb-4 border-l-4 border-blue-500 pl-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {children}
        </h2>
      );
    },
    h3({ children }: any) {
      return (
        <h3 className="mt-6 mb-3 text-xl font-semibold text-blue-700 dark:text-blue-300">
          {children}
        </h3>
      );
    },
    h4({ children }: any) {
      return (
        <h4 className="text-lg font-medium mt-4 mb-2 text-foreground">
          {children}
        </h4>
      );
    },
    h5({ children }: any) {
      return (
        <h5 className="text-base font-medium mt-3 mb-1 text-foreground">
          {children}
        </h5>
      );
    },
    h6({ children }: any) {
      return (
        <h6 className="text-sm font-medium mt-2 mb-1 text-foreground">
          {children}
        </h6>
      );
    },
    p({ children }: any) {
      return (
        <p className="mb-5 text-[15px] leading-8 text-slate-700 dark:text-slate-300">
          {children}
        </p>
      );
    },
    ul({ children }: any) {
      return (
        <ul className="mb-5 ml-6 list-disc space-y-2 text-slate-700 marker:text-blue-500 dark:text-slate-300">
          {children}
        </ul>
      );
    },
    ol({ children }: any) {
      return (
        <ol className="mb-5 ml-6 list-decimal space-y-2 text-slate-700 marker:font-semibold marker:text-blue-500 dark:text-slate-300">
          {children}
        </ol>
      );
    },
    li({ children }: any) {
      return (
        <li className="pl-1 leading-7">
          {children}
        </li>
      );
    },
    a({ children, href }: any) {
      return (
        <a 
          href={href} 
          className="font-medium text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-4 transition-colors hover:text-blue-500 dark:text-blue-400 dark:decoration-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    strong({ children }: any) {
      return (
        <strong className="font-semibold text-foreground">
          {children}
        </strong>
      );
    },
    em({ children }: any) {
      return (
        <em className="italic text-foreground">
          {children}
        </em>
      );
    },
    del({ children }: any) {
      return (
        <del className="line-through text-muted-foreground">
          {children}
        </del>
      );
    },
    img({ src, alt }: any) {
      return (
        <div className="my-6">
          <img 
            src={src} 
            alt={alt} 
            className="h-auto max-w-full rounded-xl border border-border bg-background shadow-lg"
          />
          {alt && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {alt}
            </p>
          )}
        </div>
      );
    },
    hr() {
      return (
        <hr className="my-8 border-border" />
      );
    }
  };

  // 根据预览模式渲染不同的内容
  if (previewMode === 'server' && selectedPost) {
    // 服务器预览模式
    // 从文件名中提取文章标题（不含扩展名）
    const postTitle = selectedPost.name.replace(/\.md$|\.markdown$/, '');
    
    // 提取日期前缀（如果文件名以YYYY-MM-DD格式开头）
    const dateMatch = postTitle.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    let postUrl;
    
    if (dateMatch) {
      // 如果有日期前缀，使用年/月/日/文章名的路径结构
      const year = dateMatch[1].substring(0, 4);
      const month = dateMatch[1].substring(5, 7);
      const day = dateMatch[1].substring(8, 10);
      // 直接使用原始标题，不进行任何编码或解码
      const title = dateMatch[2];
      // 确保URL以斜杠结尾，这是Hexo的默认格式
      postUrl = `${year}/${month}/${day}/${title}/`;
      console.log('生成的URL:', postUrl); // 添加日志以便调试
    } else {
      // 如果没有日期前缀，尝试从front matter中提取日期
      // 从文章内容中提取front matter
      const frontMatterMatch = content.match(/^---\s*[\s\S]*?---\s*/);
      let postDate: string | null = null;
      
      if (frontMatterMatch) {
        // 尝试从front matter中提取date字段
        const dateFieldMatch = frontMatterMatch[0].match(/date:\s*(.+)/i);
        if (dateFieldMatch) {
          // 尝试解析日期
          const dateStr = dateFieldMatch[1].trim();
          // 尝试匹配YYYY-MM-DD格式
          const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            postDate = dateMatch[1];
          }
        }
      }
      
      if (postDate) {
        // 如果找到了日期，使用它
        const year = postDate.substring(0, 4);
        const month = postDate.substring(5, 7);
        const day = postDate.substring(8, 10);
        postUrl = `${year}/${month}/${day}/${postTitle}/`;
        console.log('从front matter中提取日期:', postUrl); // 添加日志以便调试
      } else {
        // 如果没有找到日期，使用文件创建日期（如果可用）或当前日期
        // 注意：在浏览器环境中，我们无法直接获取文件创建日期
        // 这里使用当前日期作为后备方案
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        postUrl = `${year}/${month}/${day}/${postTitle}/`;
        console.log('未找到日期，使用当前日期:', postUrl); // 添加日志以便调试
      }
    }
    
    // 获取当前运行环境
    const isTauriEnv = isTauri();
    const isElectronEnv = isElectron();
    const targetUrl = iframeUrlMode === 'root' ? 'http://localhost:4000' : `http://localhost:4000/${postUrl}`;
    
    return (
      <div className={`${className}`} style={{ minWidth: 0, width: '100%', height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        {isServerRunning ? (
          <div className="h-full flex flex-col">
            {isTauriEnv ? (
              // Tauri环境：直接使用src属性
              <iframe 
                ref={iframeRef}
                src={targetUrl}
                className="flex-1 w-full border-0"
                title="服务器预览"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-top-navigation"
                onError={(e) => {
                  console.error('[Tauri] iframe加载失败:', e);
                }}
              />
            ) : isElectronEnv ? (
              // Electron环境：使用srcDoc重定向方式
              <iframe 
                ref={iframeRef}
                srcDoc={`
                  <html>
                    <head>
                      <meta http-equiv="refresh" content="0; url=${targetUrl}" />
                      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
                      <meta http-equiv="Pragma" content="no-cache" />
                      <meta http-equiv="Expires" content="0" />
                    </head>
                    <body>
                      <p>正在加载预览...</p>
                    </body>
                  </html>
                `}
                className="flex-1 w-full border-0"
                title="服务器预览"
                sandbox="allow-same-origin allow-scripts allow-forms"
                onError={(e) => {
                  console.error('[Electron] iframe加载失败:', e);
                }}
              />
            ) : (
              // 浏览器环境：直接使用src
              <iframe 
                ref={iframeRef}
                src={targetUrl}
                className="flex-1 w-full border-0"
                title="服务器预览"
                sandbox="allow-same-origin allow-scripts allow-forms"
                onError={(e) => {
                  console.error('[Browser] iframe加载失败:', e);
                }}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h3 className="text-lg font-medium mb-2 text-foreground">服务器未运行</h3>
            <p className="text-sm text-muted-foreground mb-4">
              服务器预览模式需要启动Hexo服务器才能显示最终渲染效果
            </p>
            {!hexoPath ? (
              <div className="text-sm text-red-500 mb-4">
                请先选择有效的Hexo项目目录
              </div>
            ) : null}
            <button 
              onClick={onStartServer}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={!hexoPath}
            >
              启动Hexo服务器
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // 静态预览模式（默认）
  return (
    <div className={`h-full overflow-y-auto overflow-x-hidden ${className}`} style={{ minWidth: 0, width: '100%' }}>
      <div className="mx-auto min-h-full max-w-4xl rounded-2xl border border-blue-100/80 bg-white/95 px-7 py-8 shadow-xl shadow-blue-950/10 ring-1 ring-black/5 backdrop-blur dark:border-blue-900/60 dark:bg-slate-950/95 dark:shadow-blue-950/30">
        <div className="mb-6 flex items-center justify-between border-b border-dashed border-blue-200 pb-4 dark:border-blue-900/70">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">Rendered Preview</div>
            <div className="mt-1 text-sm text-muted-foreground">Markdown 渲染结果</div>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900/70">
            Preview
          </div>
        </div>

        {content ? (
          <article className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={components}
            >
              {processedContent}
            </ReactMarkdown>
            <GiscusComments
              repo={giscusRepo}
              category={giscusCategory}
              token={giscusToken}
              term={selectedPost?.name || selectedPost?.path || 'HexoHub Preview'}
              language={language}
            />
          </article>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-12 text-center text-muted-foreground dark:border-blue-900/70 dark:bg-blue-950/20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2 text-foreground">暂无内容</h3>
            <p className="text-sm">开始编写Markdown内容，这里将显示实时预览</p>
          </div>
        )}
      </div>
    </div>
  );
}