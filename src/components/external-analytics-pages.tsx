'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { BarChart3, Eye, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  fetchGa4AnalyticsStats,
  fetchGiscusAnalyticsStats,
  type Ga4AnalyticsStats,
  type GiscusAnalyticsStats,
} from '@/lib/analytics-data';

interface AnalyticsPageBaseProps {
  language: 'zh' | 'en';
}

interface GiscusAnalyticsPageProps extends AnalyticsPageBaseProps {
  repo: string;
  category: string;
  token: string;
}

interface Ga4AnalyticsPageProps extends AnalyticsPageBaseProps {
  propertyId: string;
  serviceAccountJson: string;
}

type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'not-configured';

const formatNumber = (value: number) => new Intl.NumberFormat().format(value || 0);

const cardValueClassName = 'text-2xl font-semibold leading-none';

function AnalyticsEmptyState({ language, type }: { language: 'zh' | 'en'; type: 'comments' | 'views' }) {
  return (
    <Card>
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center text-muted-foreground">
        {type === 'comments' ? <MessageSquare className="mb-3 h-10 w-10" /> : <Eye className="mb-3 h-10 w-10" />}
        <p className="text-sm">
          {language === 'zh' ? '还没有可用于图表分析的数据' : 'No data available for chart analysis'}
        </p>
        <p className="mt-1 text-xs">
          {language === 'zh' ? '请先在面板设置中完成对应数据源配置。' : 'Complete the data source configuration in Panel Settings first.'}
        </p>
      </CardContent>
    </Card>
  );
}

function AnalyticsErrorState({ language, error }: { language: 'zh' | 'en'; error: string }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
      <CardContent className="p-4">
        <div className="text-sm font-medium text-red-700 dark:text-red-300">
          {language === 'zh' ? '数据加载失败' : 'Failed to load data'}
        </div>
        <div className="mt-2 break-words text-xs text-red-600 dark:text-red-200">{error}</div>
      </CardContent>
    </Card>
  );
}

export function GiscusCommentsAnalyticsPage({ language, repo, category, token }: GiscusAnalyticsPageProps) {
  const [state, setState] = useState<LoadState>('idle');
  const [stats, setStats] = useState<GiscusAnalyticsStats | null>(null);
  const [error, setError] = useState('');
  const isConfigured = Boolean(repo.trim() && token.trim());

  const loadStats = async () => {
    if (!isConfigured) {
      setState('not-configured');
      setStats(null);
      return;
    }

    setState('loading');
    setError('');

    try {
      const nextStats = await fetchGiscusAnalyticsStats({ repo, category, token });
      setStats(nextStats);
      setState('success');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setState('error');
    }
  };

  useEffect(() => {
    loadStats();
  }, [isConfigured, repo, category, token]);

  const topDiscussions = useMemo(() => {
    return [...(stats?.discussions || [])]
      .sort((a, b) => (b.comments + b.reactions) - (a.comments + a.reactions))
      .slice(0, 10);
  }, [stats]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{language === 'zh' ? '评论图表分析' : 'Comment Analytics'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'zh' ? '基于 Giscus 对应 GitHub Discussions 数据生成。' : 'Generated from the GitHub Discussions data used by Giscus.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={state === 'loading'}>
          <RefreshCw className={`mr-2 h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} />
          {language === 'zh' ? '刷新' : 'Refresh'}
        </Button>
      </div>

      {state === 'error' ? <AnalyticsErrorState language={language} error={error} /> : null}
      {state === 'not-configured' ? <AnalyticsEmptyState language={language} type="comments" /> : null}

      {stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '评论总数' : 'Comments'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.totalComments)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '讨论数' : 'Discussions'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.totalDiscussions)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '反应数' : 'Reactions'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.totalReactions)}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                {language === 'zh' ? '互动趋势' : 'Engagement Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[320px] w-full"
                config={{
                  comments: { label: language === 'zh' ? '评论' : 'Comments', color: '#2563eb' },
                  reactions: { label: language === 'zh' ? '反应' : 'Reactions', color: '#0f766e' },
                }}
              >
                <LineChart data={stats.timeline} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="comments" stroke="var(--color-comments)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="reactions" stroke="var(--color-reactions)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'zh' ? '高互动讨论排行' : 'Top Discussions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDiscussions.map((discussion) => (
                <div key={discussion.url} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" title={discussion.title}>{discussion.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(discussion.updatedAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 text-xs">
                    <Badge variant="secondary">{formatNumber(discussion.comments)} {language === 'zh' ? '评论' : 'comments'}</Badge>
                    <Badge variant="outline">{formatNumber(discussion.reactions)} {language === 'zh' ? '反应' : 'reactions'}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export function Ga4ViewsAnalyticsPage({ language, propertyId, serviceAccountJson }: Ga4AnalyticsPageProps) {
  const [state, setState] = useState<LoadState>('idle');
  const [stats, setStats] = useState<Ga4AnalyticsStats | null>(null);
  const [error, setError] = useState('');
  const isConfigured = Boolean(propertyId.trim() && serviceAccountJson.trim());

  const loadStats = async () => {
    if (!isConfigured) {
      setState('not-configured');
      setStats(null);
      return;
    }

    setState('loading');
    setError('');

    try {
      const nextStats = await fetchGa4AnalyticsStats({ propertyId, serviceAccountJson });
      setStats(nextStats);
      setState('success');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setState('error');
    }
  };

  useEffect(() => {
    loadStats();
  }, [isConfigured, propertyId, serviceAccountJson]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{language === 'zh' ? '阅读量图表分析' : 'View Analytics'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'zh' ? '基于 Google Analytics 4 Data API 的近 30 天数据生成。' : 'Generated from the last 30 days of Google Analytics 4 Data API data.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={state === 'loading'}>
          <RefreshCw className={`mr-2 h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} />
          {language === 'zh' ? '刷新' : 'Refresh'}
        </Button>
      </div>

      {state === 'error' ? <AnalyticsErrorState language={language} error={error} /> : null}
      {state === 'not-configured' ? <AnalyticsEmptyState language={language} type="views" /> : null}

      {stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '近 30 天阅读' : '30-day Views'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.totalViews)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '近 7 天阅读' : '7-day Views'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.last7DaysViews)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'zh' ? '活跃用户' : 'Active Users'}</CardTitle></CardHeader>
              <CardContent><div className={cardValueClassName}>{formatNumber(stats.activeUsers)}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Eye className="mr-2 h-5 w-5 text-emerald-600" />
                {language === 'zh' ? '每日阅读趋势' : 'Daily View Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[320px] w-full"
                config={{
                  views: { label: language === 'zh' ? '阅读量' : 'Views', color: '#059669' },
                  activeUsers: { label: language === 'zh' ? '活跃用户' : 'Active Users', color: '#2563eb' },
                }}
              >
                <LineChart data={stats.dailyViews} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="activeUsers" stroke="var(--color-activeUsers)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'zh' ? '页面阅读排行' : 'Top Pages'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[360px] w-full"
                config={{
                  views: { label: language === 'zh' ? '阅读量' : 'Views', color: '#059669' },
                }}
              >
                <BarChart data={stats.topPages} layout="vertical" margin={{ left: 12, right: 24, top: 12, bottom: 12 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="title" type="category" width={160} tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
