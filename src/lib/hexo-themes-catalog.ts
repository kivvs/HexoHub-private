// Hexo 官方主题目录库（hexo.io/themes 数据源）
// 数据来源：https://github.com/hexojs/site/tree/master/source/_data/themes
// 每个主题对应一个 YAML 文件，字段：description / link / preview / tags
//
// 三层加载策略（拉取一次、长期记忆）：
//   1. 30 天 localStorage 缓存（最近一次成功拉取的结果）
//   2. 打包进应用的静态目录 public/hexo-themes-catalog.json（秒开、离线可用）
//   3. 在线拉取 GitHub API（仅缓存/静态都失效，或用户手动点击"刷新"时）

export interface HexoThemeInfo {
  /** 主题名（对应 _config.yml 的 theme 值，目录名） */
  name: string;
  /** 描述 */
  description: string;
  /** GitHub 项目地址（https） */
  link: string;
  /** 预览地址 */
  preview?: string;
  tags?: string[];
}

const THEMES_API_URL = 'https://api.github.com/repos/hexojs/site/contents/source/_data/themes';
const THEMES_RAW_BASE = 'https://raw.githubusercontent.com/hexojs/site/master/source/_data/themes';
const CATALOG_CACHE_KEY = 'hexohub:theme-catalog';
// 长期缓存：拉取一次后记忆 30 天，避免重复请求 GitHub API（限流）
const CATALOG_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
// 打包进应用的静态目录（构建时由 scripts/generate-theme-catalog.js 生成）
const STATIC_CATALOG_URL = '/hexo-themes-catalog.json';

/** 环境感知的 fetch：Tauri 使用 plugin-http（Rust 后端直发，无 CORS 限制），其余环境用原生 fetch */
async function envFetch(url: string, init?: RequestInit): Promise<Response> {
  const isTauriEnv =
    typeof window !== 'undefined' &&
    (!!(window as any).__TAURI__ ||
      !!(window as any).__TAURI_INTERNALS__ ||
      !!(window as any).ipc);

  const headers = { 'User-Agent': 'HexoHub', ...(init?.headers as Record<string, string> | undefined) };

  if (isTauriEnv) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    return tauriFetch(url, {
      method: init?.method || 'GET',
      headers,
      body: init?.body as string | undefined,
    });
  }

  return fetch(url, { ...init, headers });
}

/** 解析 YAML 简易字段值（仅需 link/description/preview/tags） */
function parseSimpleYaml(content: string): { description?: string; link?: string; preview?: string; tags?: string[] } {
  const result: { description?: string; link?: string; preview?: string; tags?: string[] } = {};
  const lines = content.split('\n');
  let inTags = false;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (inTags) {
      const m = line.match(/^\s*-\s*(.+)$/);
      if (m) {
        if (!result.tags) result.tags = [];
        result.tags.push(m[1].trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      inTags = false;
    }
    const keyMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    const value = keyMatch[2].trim().replace(/^["']|["']$/g, '');
    switch (key) {
      case 'description':
        result.description = value;
        break;
      case 'link':
        result.link = value;
        break;
      case 'preview':
        result.preview = value;
        break;
      case 'tags':
        if (value) {
          result.tags = [value];
        } else {
          inTags = true;
        }
        break;
    }
  }
  return result;
}

/** 从 GitHub 地址提取仓库 SSH 地址（git@github.com:owner/repo.git） */
export function toSshUrl(githubUrl: string): string {
  const m = githubUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) return githubUrl;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, '');
  return `git@github.com:${owner}/${repo}.git`;
}

/** 从 GitHub 地址提取 https clone 地址 */
export function toHttpsCloneUrl(githubUrl: string): string {
  const m = githubUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) return githubUrl;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, '');
  return `https://github.com/${owner}/${repo}.git`;
}

/** 判断是否为有效的 GitHub 主题链接 */
export function isGithubLink(link: string): boolean {
  return /github\.com[/:][^/]+\/[^/]+/.test(link || '');
}

/** 从本地缓存读取主题目录（30 天记忆） */
export function getCachedCatalog(): HexoThemeInfo[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > CATALOG_CACHE_TTL) return null;
    return parsed.items as HexoThemeInfo[];
  } catch {
    return null;
  }
}

/** 读取打包进应用的静态主题目录（秒开，离线可用） */
export async function loadStaticCatalog(): Promise<HexoThemeInfo[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(STATIC_CATALOG_URL);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.items) && data.items.length > 0) {
      return data.items as HexoThemeInfo[];
    }
    return null;
  } catch {
    return null;
  }
}

/** 缓存主题目录（更新记忆时间） */
function cacheCatalog(items: HexoThemeInfo[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ items, savedAt: Date.now() })
    );
  } catch {
    // localStorage 满则忽略
  }
}

/**
 * 获取 hexo.io 全部主题目录。
 * - forceRefresh=false：30 天缓存 → 静态 JSON（秒开）→ 在线拉取
 * - forceRefresh=true：强制在线拉取，成功后刷新缓存（更新 30 天记忆）
 */
export async function fetchHexoThemeCatalog(
  forceRefresh = false,
  onProgress?: (done: number, total: number) => void
): Promise<HexoThemeInfo[]> {
  // 非强制刷新：优先读长期缓存（30 天记忆）
  if (!forceRefresh) {
    const cached = getCachedCatalog();
    if (cached && cached.length > 0) return cached;
    // 缓存失效时读取打包的静态目录（秒开，无需网络）
    const staticCatalog = await loadStaticCatalog();
    if (staticCatalog && staticCatalog.length > 0) {
      cacheCatalog(staticCatalog); // 把静态目录写入缓存，下次更快
      return staticCatalog;
    }
  }

  // 1. 列出主题目录（获取全部文件名）
  let listRes: Response;
  try {
    listRes = await envFetch(THEMES_API_URL);
  } catch (error) {
    throw new Error(
      `无法连接 GitHub（网络或跨域限制）: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!listRes.ok) {
    const detail =
      listRes.status === 403 || listRes.status === 429
        ? 'GitHub API 请求过于频繁（限流），请稍后重试'
        : `HTTP ${listRes.status}`;
    throw new Error(`获取主题列表失败: ${detail}`);
  }
  const entries = (await listRes.json()) as Array<{
    name: string;
    type: string;
  }>;
  const themeFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.yml'));
  const total = themeFiles.length;

  const items: HexoThemeInfo[] = [];

  // 2. 并发解析每个主题 YAML（并发 12，控制请求量）
  const concurrency = 12;
  let index = 0;
  const worker = async () => {
    while (index < themeFiles.length) {
      const file = themeFiles[index];
      const i = index;
      index += 1;
      try {
        const res = await envFetch(`${THEMES_RAW_BASE}/${encodeURIComponent(file.name)}`);
        if (!res.ok) continue;
        const content = await res.text();
        const parsed = parseSimpleYaml(content);
        const name = file.name.replace(/\.yml$/i, '');
        if (parsed.link && isGithubLink(parsed.link)) {
          items.push({
            name,
            description: parsed.description || '',
            link: parsed.link,
            preview: parsed.preview,
            tags: parsed.tags,
          });
        }
      } catch {
        // 单个失败不影响整体
      }
      if (onProgress) onProgress(i + 1, total);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));

  items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  // 拉取成功后写入 30 天缓存（下次秒开）
  if (items.length > 0) {
    cacheCatalog(items);
  }

  if (onProgress) onProgress(total, total);
  return items;
}
