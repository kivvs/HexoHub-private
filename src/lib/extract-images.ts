// 文章图片提取工具
// 用于从文章内容中解析外部图片引用（HTML <img> 或 Markdown 语法），
// 支持下载、重命名并替换正文中的引用。

export interface ImageSourceMatch {
  /** 匹配到的原始文本片段（如整个 <img ...> 标签或 ![alt](url)） */
  raw: string;
  /** 图片 URL */
  src: string;
  /** 匹配类型 */
  kind: 'html' | 'markdown';
}

// 匹配 HTML <img> 标签（属性顺序不限，src 使用双引号或单引号）
const HTML_IMG_REGEX = /<img\b[^>]*?src\s*=\s*["']([^"']+)["'][^>]*>/gi;

// 匹配 Markdown 图片语法：![alt](url)、![alt](url "title")
const MARKDOWN_IMG_REGEX = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/gi;

// 支持的图片扩展名
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'avif', 'ico', 'jfif', 'pjpeg', 'pjp'];

/**
 * 从文章内容中解析出所有外部图片引用。
 * 相同 URL 会去重（保留第一次出现的原始片段）。
 */
export function findImageSources(content: string): ImageSourceMatch[] {
  const matches: ImageSourceMatch[] = [];
  const seenSrcs = new Set<string>();

  const pushMatch = (raw: string, src: string, kind: 'html' | 'markdown') => {
    const trimmedSrc = src.trim();
    if (!trimmedSrc) return;
    if (seenSrcs.has(trimmedSrc)) return;
    seenSrcs.add(trimmedSrc);
    matches.push({ raw, src: trimmedSrc, kind });
  };

  // 解析 HTML <img> 标签
  HTML_IMG_REGEX.lastIndex = 0;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = HTML_IMG_REGEX.exec(content)) !== null) {
    pushMatch(htmlMatch[0], htmlMatch[1], 'html');
  }

  // 解析 Markdown 图片语法
  MARKDOWN_IMG_REGEX.lastIndex = 0;
  let markdownMatch: RegExpExecArray | null;
  while ((markdownMatch = MARKDOWN_IMG_REGEX.exec(content)) !== null) {
    pushMatch(markdownMatch[0], markdownMatch[1], 'markdown');
  }

  return matches;
}

/**
 * 根据 URL 路径或 Content-Type 推断图片扩展名。
 * 默认返回 png。
 */
export function inferImageExtension(src: string, contentType?: string | null): string {
  // 优先从 URL 路径推断（剥离查询参数和锚点）
  const cleanUrl = (src || '').split('?')[0].split('#')[0];
  const pathMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
  if (pathMatch) {
    const ext = pathMatch[1].toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }

  // 其次从 Content-Type 推断
  if (contentType) {
    const mimeMatch = contentType.toLowerCase().match(/(?:image|application)\/([a-zA-Z0-9.+-]+)/);
    if (mimeMatch) {
      const mime = mimeMatch[1].toLowerCase();
      if (mime.includes('svg')) return 'svg';
      if (mime.includes('webp')) return 'webp';
      if (mime.includes('gif')) return 'gif';
      if (mime.includes('bmp')) return 'bmp';
      if (mime.includes('avif')) return 'avif';
      if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
      if (mime.includes('png')) return 'png';
    }
  }

  return 'png';
}

/**
 * 用新的图片引用替换正文中的原始引用。
 * 支持同一原始片段出现多次（全部替换）。
 */
export function replaceImageSources(
  content: string,
  replacements: Array<{ raw: string; replacement: string }>
): string {
  let result = content;
  for (const { raw, replacement } of replacements) {
    if (!raw) continue;
    result = result.split(raw).join(replacement);
  }
  return result;
}
