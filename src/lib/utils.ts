import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isDesktopApp, getDesktopEnvironment } from "./desktop-api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==================== 路径处理 ====================
// 
// 【重要】不要自己写 path.replace()，统一使用这两个函数
//
// normalizePath() → 显示给用户、保存到 localStorage
// normalizePathInternal() → 传给后端 API、拼接路径
//
// ===================================================

/**
 * 规范化路径用于显示
 * - Windows: D:\Project\HexoHub
 * - macOS/Linux: /Users/project/hexohub
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  
  const isWindows = typeof navigator !== 'undefined' && 
    (navigator.platform.toLowerCase().includes('win') || 
     navigator.userAgent.toLowerCase().includes('windows'));
  
  return isWindows ? path.replace(/\//g, '\\') : path.replace(/\\/g, '/');
}

/**
 * 规范化路径用于内部处理
 * - 统一使用正斜杠: D:/Project/HexoHub
 * - 避免混合分隔符: D:\01/blog → D:/01/blog
 * - 移除重复分隔符: D://blog → D:/blog
 */
export function normalizePathInternal(path: string): string {
  if (!path || typeof path !== 'string') return path || '';

  let normalized = path.replace(/[\\/]/g, '/').replace(/\/+/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * 转义 shell 参数：用双引号包裹，内部双引号转义，移除换行符
 * - Windows (cmd/PowerShell): 内部双引号 → ""
 * - Unix (sh/bash): 内部双引号 → \"，反斜杠/`/$/! 也转义
 *
 * 用于把用户输入（如 git user.name、repo URL、分支名）安全拼入 shell 命令，
 * 防止 `&`、`|`、换行符等导致命令注入。
 */
export function escapeShellArg(arg: string): string {
  if (arg == null) return '""';
  // 移除换行符，防止命令分隔
  const str = String(arg).replace(/[\r\n]/g, '');

  const isWindows = typeof navigator !== 'undefined' &&
    (navigator.platform.toLowerCase().includes('win') ||
     navigator.userAgent.toLowerCase().includes('windows'));

  if (isWindows) {
    // cmd / PowerShell: 内部双引号用 "" 转义
    return `"${str.replace(/"/g, '""')}"`;
  } else {
    // sh / bash: 内部双引号、反斜杠、$ ` ! 用反斜杠转义
    const escaped = str.replace(/(["\\$`!])/g, '\\$1');
    return `"${escaped}"`;
  }
}

// ==================== AI API URL 构造 ====================
//
// 统一处理 OpenAI 兼容 API 端点的 URL 拼接，避免以下问题：
// 1. 末尾斜杠未处理：https://api.openai.com/v1/ → .../v1//chat/completions
// 2. 端点已含路径：https://api.openai.com/v1/chat/completions → .../chat/completions/chat/completions
//
// =================================================================

/**
 * 脱敏 OpenAI 风格 API key（sk-xxx / sk-proj-xxx）
 * OpenAI 错误信息中常直接回显完整 key，需在 UI 中隐藏
 * 保留前 7 位 + 末 4 位，中间用 * 替代
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 11) return '*'.repeat(key.length);

  const head = key.slice(0, 7);
  const tail = key.slice(-4);
  return `${head}${'*'.repeat(Math.min(key.length - 11, 16))}${tail}`;
}

/**
 * 本地化 AI API 错误信息
 * - 统一对 OpenAI 风格的明文 API key 脱敏
 * - 识别常见错误模式（401/403/404/429/5xx/网络错误）并返回中文/英文提示
 * - 未匹配时返回原始错误（已脱敏）
 */
export function localizeApiError(message: string | undefined, language: 'zh' | 'en' = 'zh'): string {
  const fallback = language === 'zh'
    ? '请检查 API 密钥和配置是否正确'
    : 'Please check if API key and configuration are correct';

  if (!message) return fallback;

  // 1. 对消息中所有疑似 API key（sk- / sk-proj- 开头，至少 20 位）做脱敏
  let safe = message.replace(/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g, (m) => maskApiKey(m));

  // 2. 去除错误自带的索引链接（脱敏后无意义且占空间）
  safe = safe.replace(/\s*You can find your API key at[^\n.]*\.?/i, '');
  safe = safe.replace(/\u8bf7\u5728[^\n\u3002]*\u67e5\u770b[^\n\u3002]*\u3002?/g, '');

  // 截断过长消息，避免 Toast 太长
  const trimmed = safe.length > 200 ? safe.slice(0, 200) + '...' : safe;
  const lower = trimmed.toLowerCase();

  // 3. 网络错误
  if (/failed to fetch|networkerror|network request failed|load failed|cors|timeout|econnrefused/.test(lower)) {
    return language === 'zh'
      ? '网络请求失败，请检查网络连接或 API 端点是否可访问'
      : 'Network request failed. Please check your network or whether the API endpoint is reachable.';
  }

  // 4. 401 / 鉴权失败
  // 注意：中转站常把 model 不支持、请求格式错误等也包装成 401/Incorrect API key，
  // 因此必须保留原始信息供用户排查，不能用固定话术掩盖
  if (/incorrect api key|invalid api key|invalid authentication|authentication failed|unauthorized|401/.test(lower)) {
    return language === 'zh'
      ? `鉴权失败（HTTP 401）。中转站常因模型名不支持或请求格式不符而返回此错误，请核对：1) 密钥是否正确；2) 模型名是否在中转站支持列表中；3) API 路径是否正确。原始错误：${trimmed}`
      : `Authentication failed (HTTP 401). Proxies often return this when the model name is unsupported or the request format is wrong. Please verify: 1) API key is correct; 2) model name is supported by the proxy; 3) API path is correct. Original error: ${trimmed}`;
  }

  // 5. 403 / 权限/地区限制
  if (/403|forbidden|not authorized|access denied|region|country not supported/.test(lower)) {
    return language === 'zh'
      ? `访问被拒绝（可能是地区限制或权限不足）：${trimmed}`
      : `Access denied (possibly region restriction or insufficient permissions): ${trimmed}`;
  }

  // 6. 404 / 模型不存在或端点错误
  if (/404|not found|model_not_found|does not exist|invalid model/.test(lower)) {
    return language === 'zh'
      ? `模型或端点不存在，请检查 API 端点（是否漏掉 /v1）和模型名是否正确：${trimmed}`
      : `Model or endpoint not found. Please verify the API endpoint (e.g. /v1) and model name: ${trimmed}`;
  }

  // 7. 429 / 速率限制
  if (/429|rate limit|rate_limit|too many requests|quota/.test(lower)) {
    return language === 'zh'
      ? '请求频率超限或余额不足，请稍后重试或检查账户余额'
      : 'Rate limit exceeded or insufficient quota. Please retry later or check your account balance.';
  }

  // 8. 5xx / 服务端错误
  if (/5\d\d|internal server error|bad gateway|service unavailable|server error/.test(lower)) {
    return language === 'zh'
      ? 'AI 服务暂时不可用，请稍后重试'
      : 'AI service temporarily unavailable. Please retry later.';
  }

  // 9. 未匹配：返回脱敏后的原始消息
  return trimmed;
}

/**
 * 根据 provider 构造 AI API 的完整请求 URL
 * - deepseek / siliconflow：使用固定端点（忽略 openaiApiEndpoint 与 apiPath）
 * - openai：基于用户填写的端点 + 路径后缀拼接，自动处理末尾斜杠与已含路径的情况
 *
 * @param provider AI 提供商：'deepseek' | 'siliconflow' | 'openai'
 * @param openaiApiEndpoint 仅 openai provider 使用，用户填写的 API 端点（如 https://api.openai.com/v1）
 * @param apiPath 仅 openai provider 使用，请求路径后缀，默认 '/chat/completions'
 *   常见取值：
 *   - '/chat/completions'（OpenAI 标准，端点已含 /v1）
 *   - '/v1/chat/completions'（端点不含版本号的中转站）
 *   - '/v1/messages'（Anthropic 风格，需配套调整请求体）
 *   - 任意自定义路径
 */
export function buildAiApiUrl(
  provider: 'deepseek' | 'siliconflow' | 'openai',
  openaiApiEndpoint?: string,
  apiPath: string = '/chat/completions'
): string {
  if (provider === 'deepseek') {
    return 'https://api.deepseek.com/v1/chat/completions';
  }
  if (provider === 'siliconflow') {
    return 'https://api.siliconflow.cn/v1/chat/completions';
  }

  // openai provider
  let endpoint = (openaiApiEndpoint || 'https://api.openai.com/v1').trim();

  // 规范化路径后缀：确保以 / 开头，去除末尾斜杠
  let suffix = (apiPath || '/chat/completions').trim();
  if (!suffix.startsWith('/')) {
    suffix = '/' + suffix;
  }
  while (suffix.length > 1 && suffix.endsWith('/')) {
    suffix = suffix.slice(0, -1);
  }

  // 去除端点末尾斜杠
  while (endpoint.endsWith('/')) {
    endpoint = endpoint.slice(0, -1);
  }

  // 如果用户填的端点已经完整包含了路径后缀，则不再重复拼接
  // 例如 endpoint = https://x.com/v1/chat/completions，suffix = /chat/completions
  // 此时 endsWith('/chat/completions') = true，截掉后 endpoint = https://x.com/v1
  if (endpoint.endsWith(suffix)) {
    endpoint = endpoint.slice(0, -suffix.length);
    while (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }
  } else {
    // 处理 /v1 重复的情况：
    // 端点以 /v1 结尾，路径以 /v1 开头 → 从路径中去掉 /v1 前缀，避免 /v1/v1
    const versionSegs = ['/v1', '/v2'];
    for (const ver of versionSegs) {
      if (endpoint.endsWith(ver) && suffix.startsWith(ver + '/')) {
        suffix = suffix.slice(ver.length); // 去掉路径开头的 /v1
        break;
      }
    }
  }

  return `${endpoint}${suffix}`;
}

/**
 * 打开外部链接
 * 自动检测环境（Electron/Tauri/Browser）并使用相应的方法
 * @param url 要打开的链接地址
 */
export async function openExternalLink(url: string): Promise<void> {
  if (!isDesktopApp()) {
    // 浏览器环境
    window.open(url, '_blank');
    return;
  }

  const env = getDesktopEnvironment();
  
  if (env === 'tauri') {
    // Tauri 环境 - 使用 shell.open
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } catch (error) {
      console.error('Failed to open external link with Tauri shell:', error);
      window.open(url, '_blank');
    }
  } else if (env === 'electron') {
    // Electron 环境 - 使用 electron shell
    try {
      const shell = (window as any).require ? (window as any).require('electron').shell : null;
      if (shell) {
        shell.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open external link with Electron shell:', error);
      window.open(url, '_blank');
    }
  } else {
    // Fallback
    window.open(url, '_blank');
  }
}

/**
 * 获取应用版本号
 * 根据运行环境自动选择获取方式：
 * - Tauri: 使用 Tauri API
 * - Electron: 通过 IPC 从 package.json 读取
 * - Browser: 返回构建时的版本号
 * @returns Promise<string> 版本号，如果获取失败返回 'Unknown'
 */
export async function getAppVersion(): Promise<string> {
  const env = getDesktopEnvironment();
  
  // Tauri 环境
  if (env === 'tauri') {
    try {
      const { getAppVersion: getTauriVersion } = await import('@/lib/tauri-api');
      return await getTauriVersion();
    } catch (error) {
      console.error('Failed to get Tauri version:', error);
      return 'Unknown';
    }
  }
  
  // Electron 环境
  if (env === 'electron') {
    try {
      const ipcRenderer = (window as any).require('electron').ipcRenderer;
      const version = await ipcRenderer.invoke('get-app-version');
      if (version) return version;
      return 'Unknown';
    } catch (error) {
      console.error('Failed to get Electron version:', error);
      return 'Unknown';
    }
  }
  
  // Browser 环境 - 开发模式或未知环境
  // 注意：由于使用静态导出，无法使用 API 路由
  // 如果需要在浏览器中显示版本号，可以在构建时注入环境变量
  return process.env.NEXT_PUBLIC_APP_VERSION || 'Unknown';
}