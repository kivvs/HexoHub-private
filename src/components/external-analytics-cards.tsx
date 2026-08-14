'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchGa4AnalyticsStats,
  fetchGiscusAnalyticsStats,
  type Ga4AnalyticsStats,
  type GiscusAnalyticsStats,
} from '@/lib/analytics-data';

interface ExternalAnalyticsCardsProps {
  language: 'zh' | 'en';
  giscusRepo: string;
  giscusCategory: string;
  giscusToken: string;
  ga4PropertyId: string;
  ga4ServiceAccountJson: string;
  onOpenGiscusAnalytics?: () => void;
  onOpenGa4Analytics?: () => void;
}

type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'not-configured';

const formatNumber = (value: number) => new Intl.NumberFormat().format(value || 0);

const formatDate = (value?: string, language: 'zh' | 'en' = 'zh') => {
  if (!value) return language === 'zh' ? '暂无更新' : 'No updates';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'zh' ? '暂无更新' : 'No updates';
  return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export function ExternalAnalyticsCards({
  language,
  giscusRepo,
  giscusCategory,
  giscusToken,
  ga4PropertyId,
  ga4ServiceAccountJson,
  onOpenGiscusAnalytics,
  onOpenGa4Analytics,
}: ExternalAnalyticsCardsProps) {
  const [giscusState, setGiscusState] = useState<LoadState>('idle');
  const [ga4State, setGa4State] = useState<LoadState>('idle');
  const [giscusStats, setGiscusStats] = useState<GiscusAnalyticsStats | null>(null);
  const [ga4Stats, setGa4Stats] = useState<Ga4AnalyticsStats | null>(null);
  const [giscusError, setGiscusError] = useState('');
  const [ga4Error, setGa4Error] = useState('');

  const isGiscusConfigured = useMemo(() => Boolean(giscusRepo.trim() && giscusToken.trim()), [giscusRepo, giscusToken]);
  const isGa4Configured = useMemo(() => Boolean(ga4PropertyId.trim() && ga4ServiceAccountJson.trim()), [ga4PropertyId, ga4ServiceAccountJson]);

  const loadGiscusStats = async () => {
    if (!isGiscusConfigured) {
      setGiscusState('not-configured');
      setGiscusStats(null);
      return;
    }

    setGiscusState('loading');
    setGiscusError('');

    try {
      const stats = await fetchGiscusAnalyticsStats({
        repo: giscusRepo,
        category: giscusCategory,
        token: giscusToken,
      });
      setGiscusStats(stats);
      setGiscusState('success');
    } catch (error) {
      setGiscusError(error instanceof Error ? error.message : String(error));
      setGiscusState('error');
    }
  };

  const loadGa4Stats = async () => {
    if (!isGa4Configured) {
      setGa4State('not-configured');
      setGa4Stats(null);
      return;
    }

    setGa4State('loading');
    setGa4Error('');

    try {
      const stats = await fetchGa4AnalyticsStats({
        propertyId: ga4PropertyId,
        serviceAccountJson: ga4ServiceAccountJson,
      });
      setGa4Stats(stats);
      setGa4State('success');
    } catch (error) {
      setGa4Error(error instanceof Error ? error.message : String(error));
      setGa4State('error');
    }
  };

  useEffect(() => {
    loadGiscusStats();
  }, [isGiscusConfigured, giscusRepo, giscusCategory, giscusToken]);

  useEffect(() => {
    loadGa4Stats();
  }, [isGa4Configured, ga4PropertyId, ga4ServiceAccountJson]);

  const statusText = (state: LoadState) => {
    if (state === 'loading') return language === 'zh' ? '加载中' : 'Loading';
    if (state === 'error') return language === 'zh' ? '失败' : 'Failed';
    if (state === 'not-configured') return language === 'zh' ? '未配置' : 'Not set';
    return language === 'zh' ? '已同步' : 'Synced';
  };

  return (
    <div className="mx-4 mb-4 space-y-4">
      <Card className="overflow-hidden border-blue-100 bg-blue-50/45 dark:border-blue-950 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center text-sm">
              <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
              {language === 'zh' ? 'Giscus 评论' : 'Giscus Comments'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={loadGiscusStats}
              disabled={giscusState === 'loading'}
              title={language === 'zh' ? '刷新 Giscus 数据' : 'Refresh Giscus data'}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${giscusState === 'loading' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold leading-none">
                {giscusStats ? formatNumber(giscusStats.totalComments) : '--'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {language === 'zh' ? '评论数' : 'Comments'}
              </div>
            </div>
            <Badge variant={giscusState === 'error' ? 'destructive' : 'secondary'}>
              {statusText(giscusState)}
            </Badge>
          </div>
          {giscusStats ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-background/70 p-2">
                <div className="font-medium">{formatNumber(giscusStats.totalDiscussions)}</div>
                <div className="text-muted-foreground">{language === 'zh' ? '讨论' : 'Discussions'}</div>
              </div>
              <div className="rounded-md bg-background/70 p-2">
                <div className="font-medium">{formatNumber(giscusStats.totalReactions)}</div>
                <div className="text-muted-foreground">{language === 'zh' ? '反应' : 'Reactions'}</div>
              </div>
            </div>
          ) : null}
          <div className="truncate text-xs text-muted-foreground" title={giscusError || giscusStats?.latestDiscussionTitle || ''}>
            {giscusState === 'error'
              ? giscusError
              : giscusStats?.latestDiscussionTitle
                ? `${formatDate(giscusStats.latestUpdatedAt, language)} · ${giscusStats.latestDiscussionTitle}`
                : language === 'zh' ? '在设置中填写仓库和 Token' : 'Set repo and token in settings'}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            onClick={onOpenGiscusAnalytics}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {language === 'zh' ? '评论图表分析' : 'Comment Charts'}
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-100 bg-emerald-50/45 dark:border-emerald-950 dark:bg-emerald-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center text-sm">
              <Eye className="mr-2 h-4 w-4 text-emerald-600" />
              {language === 'zh' ? 'GA4 阅读量' : 'GA4 Views'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={loadGa4Stats}
              disabled={ga4State === 'loading'}
              title={language === 'zh' ? '刷新 GA4 数据' : 'Refresh GA4 data'}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${ga4State === 'loading' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold leading-none">
                {ga4Stats ? formatNumber(ga4Stats.totalViews) : '--'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {language === 'zh' ? '近 30 天阅读' : '30-day views'}
              </div>
            </div>
            <Badge variant={ga4State === 'error' ? 'destructive' : 'secondary'}>
              {statusText(ga4State)}
            </Badge>
          </div>
          {ga4Stats ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-background/70 p-2">
                <div className="font-medium">{formatNumber(ga4Stats.last7DaysViews)}</div>
                <div className="text-muted-foreground">{language === 'zh' ? '近 7 天' : '7 days'}</div>
              </div>
              <div className="rounded-md bg-background/70 p-2">
                <div className="font-medium">{formatNumber(ga4Stats.activeUsers)}</div>
                <div className="text-muted-foreground">{language === 'zh' ? '活跃用户' : 'Active users'}</div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-1 truncate text-xs text-muted-foreground" title={ga4Error}>
            <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {ga4State === 'error'
                ? ga4Error
                : isGa4Configured
                  ? (language === 'zh' ? 'Google Analytics Data API' : 'Google Analytics Data API')
                  : (language === 'zh' ? '在设置中填写 GA4 配置' : 'Set GA4 config in settings')}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            onClick={onOpenGa4Analytics}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {language === 'zh' ? '阅读量图表分析' : 'View Charts'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
