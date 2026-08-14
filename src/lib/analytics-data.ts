'use client';

import { isTauri } from '@/lib/desktop-api';

export interface GiscusAnalyticsConfig {
  repo: string;
  category?: string;
  token: string;
}

export interface GiscusEmbedConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

export interface GiscusAnalyticsDiscussion {
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  comments: number;
  reactions: number;
}

export interface GiscusAnalyticsTimelinePoint {
  date: string;
  discussions: number;
  comments: number;
  reactions: number;
}

export interface GiscusAnalyticsStats {
  totalDiscussions: number;
  totalComments: number;
  totalReactions: number;
  latestDiscussionTitle?: string;
  latestDiscussionUrl?: string;
  latestUpdatedAt?: string;
  discussions: GiscusAnalyticsDiscussion[];
  timeline: GiscusAnalyticsTimelinePoint[];
}

export interface Ga4AnalyticsConfig {
  propertyId: string;
  serviceAccountJson: string;
}

export interface Ga4AnalyticsDailyPoint {
  date: string;
  views: number;
  activeUsers: number;
}

export interface Ga4AnalyticsPagePoint {
  path: string;
  title: string;
  views: number;
  activeUsers: number;
}

export interface Ga4AnalyticsStats {
  totalViews: number;
  activeUsers: number;
  last7DaysViews: number;
  dailyViews: Ga4AnalyticsDailyPoint[];
  topPages: Ga4AnalyticsPagePoint[];
}

const textEncoder = new TextEncoder();

const toDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toISOString().slice(0, 10);
};

const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
  const headers = init.headers || {};

  let response: Response;
  if (isTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    response = await tauriFetch(url, {
      ...init,
      headers,
    });
  } else {
    response = await fetch(url, {
      ...init,
      headers,
    });
  }

  const responseText = await response.text();
  let payload: any = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
};

export const parseGitHubRepo = (repo: string) => {
  const normalized = repo.trim()
    .replace(/^https:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');
  const [owner, name] = normalized.split('/');

  if (!owner || !name) {
    throw new Error('Invalid GitHub repository format. Use owner/name.');
  }

  return { owner, name };
};

const githubGraphql = async <T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> => {
  const payload = await requestJson<{ data?: T; errors?: Array<{ message: string }> }>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  if (!payload.data) {
    throw new Error('GitHub GraphQL response is empty.');
  }

  return payload.data;
};

export const fetchGiscusEmbedConfig = async (config: GiscusAnalyticsConfig): Promise<GiscusEmbedConfig> => {
  const { owner, name } = parseGitHubRepo(config.repo);
  const categoryName = config.category?.trim().toLowerCase();

  const data = await githubGraphql<{
    repository: {
      id: string;
      discussionCategories: {
        nodes: Array<{ id: string; name: string; slug: string }>;
      };
    };
  }>(config.token, `
    query GetGiscusEmbedConfig($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        discussionCategories(first: 50) {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  `, { owner, name });

  const categories = data.repository.discussionCategories.nodes;
  const category = categoryName
    ? categories.find((item) => item.name.toLowerCase() === categoryName || item.slug.toLowerCase() === categoryName)
    : categories[0];

  if (!category) {
    throw new Error(categoryName
      ? `Discussion category not found: ${config.category}`
      : 'No GitHub Discussion categories found in this repository.');
  }

  return {
    repo: `${owner}/${name}`,
    repoId: data.repository.id,
    category: category.name,
    categoryId: category.id,
  };
};

export const fetchGiscusAnalyticsStats = async (config: GiscusAnalyticsConfig): Promise<GiscusAnalyticsStats> => {
  const { owner, name } = parseGitHubRepo(config.repo);
  const categoryName = config.category?.trim().toLowerCase();

  const categoryData = await githubGraphql<{
    repository: {
      discussionCategories: {
        nodes: Array<{ id: string; name: string; slug: string }>;
      };
    };
  }>(config.token, `
    query GetDiscussionCategories($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        discussionCategories(first: 50) {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  `, { owner, name });

  const categoryId = categoryName
    ? categoryData.repository.discussionCategories.nodes.find((category) => (
      category.name.toLowerCase() === categoryName || category.slug.toLowerCase() === categoryName
    ))?.id
    : undefined;

  if (categoryName && !categoryId) {
    throw new Error(`Discussion category not found: ${config.category}`);
  }

  const queryWithCategory = `
    query GetGiscusStats($owner: String!, $name: String!, $categoryId: ID!) {
      repository(owner: $owner, name: $name) {
        discussions(first: 100, categoryId: $categoryId, orderBy: { field: UPDATED_AT, direction: DESC }) {
          totalCount
          nodes {
            title
            url
            createdAt
            updatedAt
            comments { totalCount }
            reactions { totalCount }
          }
        }
      }
    }
  `;

  const queryAll = `
    query GetGiscusStats($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        discussions(first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
          totalCount
          nodes {
            title
            url
            createdAt
            updatedAt
            comments { totalCount }
            reactions { totalCount }
          }
        }
      }
    }
  `;

  const statsData = await githubGraphql<{
    repository: {
      discussions: {
        totalCount: number;
        nodes: Array<{
          title: string;
          url: string;
          createdAt: string;
          updatedAt: string;
          comments: { totalCount: number };
          reactions: { totalCount: number };
        }>;
      };
    };
  }>(config.token, categoryId ? queryWithCategory : queryAll, categoryId ? { owner, name, categoryId } : { owner, name });

  const discussions = statsData.repository.discussions.nodes.map((discussion) => ({
    title: discussion.title,
    url: discussion.url,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    comments: discussion.comments.totalCount,
    reactions: discussion.reactions.totalCount,
  }));
  const latest = discussions[0];
  const timelineMap = discussions.reduce<Record<string, GiscusAnalyticsTimelinePoint>>((groups, discussion) => {
    const date = toDateKey(discussion.updatedAt);
    if (!groups[date]) {
      groups[date] = { date, discussions: 0, comments: 0, reactions: 0 };
    }
    groups[date].discussions += 1;
    groups[date].comments += discussion.comments;
    groups[date].reactions += discussion.reactions;
    return groups;
  }, {});

  return {
    totalDiscussions: statsData.repository.discussions.totalCount,
    totalComments: discussions.reduce((sum, discussion) => sum + discussion.comments, 0),
    totalReactions: discussions.reduce((sum, discussion) => sum + discussion.reactions, 0),
    latestDiscussionTitle: latest?.title,
    latestDiscussionUrl: latest?.url,
    latestUpdatedAt: latest?.updatedAt,
    discussions,
    timeline: Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date)),
  };
};

const base64UrlEncodeBytes = (bytes: ArrayBuffer | Uint8Array) => {
  const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlEncodeJson = (value: unknown) => base64UrlEncodeBytes(textEncoder.encode(JSON.stringify(value)));

const pemToArrayBuffer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const createGoogleJwt = async (serviceAccount: any) => {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const unsignedToken = [
    base64UrlEncodeJson({ alg: 'RS256', typ: 'JWT' }),
    base64UrlEncodeJson({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  ].join('.');

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, textEncoder.encode(unsignedToken));

  return `${unsignedToken}.${base64UrlEncodeBytes(signature)}`;
};

const getGoogleAccessToken = async (serviceAccountJson: string) => {
  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error('Invalid Google service account JSON.');
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Google service account JSON must include client_email and private_key.');
  }

  const tokenUri = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const jwt = await createGoogleJwt(serviceAccount);
  const tokenPayload = await requestJson<{ access_token: string }>(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenPayload.access_token) {
    throw new Error('Google OAuth response does not include access_token.');
  }

  return tokenPayload.access_token;
};

const runGa4Report = async (
  propertyId: string,
  accessToken: string,
  startDate: string,
  dimensions: Array<{ name: string }> = []
) => {
  const normalizedPropertyId = propertyId.trim().replace(/^properties\//, '');
  const report = await requestJson<{
    rows?: Array<{
      dimensionValues?: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    }>;
  }>(`https://analyticsdata.googleapis.com/v1beta/properties/${normalizedPropertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions,
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
    }),
  });

  const row = report.rows?.[0];
  return {
    views: Number(row?.metricValues?.[0]?.value || 0),
    activeUsers: Number(row?.metricValues?.[1]?.value || 0),
    rows: report.rows || [],
  };
};

export const fetchGa4AnalyticsStats = async (config: Ga4AnalyticsConfig): Promise<Ga4AnalyticsStats> => {
  const accessToken = await getGoogleAccessToken(config.serviceAccountJson);
  const last30Days = await runGa4Report(config.propertyId, accessToken, '30daysAgo');
  const last7Days = await runGa4Report(config.propertyId, accessToken, '7daysAgo');
  const dailyReport = await runGa4Report(config.propertyId, accessToken, '30daysAgo', [{ name: 'date' }]);
  const pageReport = await runGa4Report(config.propertyId, accessToken, '30daysAgo', [
    { name: 'pagePath' },
    { name: 'pageTitle' },
  ]);

  return {
    totalViews: last30Days.views,
    activeUsers: last30Days.activeUsers,
    last7DaysViews: last7Days.views,
    dailyViews: dailyReport.rows.map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value || '';
      const date = rawDate.length === 8 ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : rawDate;
      return {
        date,
        views: Number(row.metricValues?.[0]?.value || 0),
        activeUsers: Number(row.metricValues?.[1]?.value || 0),
      };
    }).sort((a, b) => a.date.localeCompare(b.date)),
    topPages: pageReport.rows.map((row) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      title: row.dimensionValues?.[1]?.value || row.dimensionValues?.[0]?.value || '/',
      views: Number(row.metricValues?.[0]?.value || 0),
      activeUsers: Number(row.metricValues?.[1]?.value || 0),
    })).sort((a, b) => b.views - a.views).slice(0, 10),
  };
};
