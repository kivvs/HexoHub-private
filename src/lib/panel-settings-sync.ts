import { getIpcRenderer, isDesktopApp, isTauri } from './desktop-api';

// 仅同步“面板设置”及项目选择，不同步文章正文、临时编辑状态等业务数据。
export const PANEL_SETTING_KEYS = [
  'auto-check-updates',
  'app-language',
  'app-theme',
  'posts-per-page',
  'auto-save-interval',
  'editor-mode',
  'background-image',
  'background-opacity',
  'image-base-url',
  'giscus-repo',
  'giscus-category',
  'giscus-token',
  'ga4-property-id',
  'ga4-service-account-json',
  'enable-push',
  'push-repo-url',
  'push-branch',
  'push-username',
  'push-email',
  'enable-custom-commands',
  'custom-clean-command',
  'custom-generate-command',
  'custom-server-command',
  'custom-deploy-command',
  'enable-ai',
  'enable-editor-ai',
  'ai-provider',
  'api-key',
  'prompt',
  'analysis-prompt',
  'ai-rewrite-prompt',
  'ai-improve-prompt',
  'ai-expand-prompt',
  'ai-translate-prompt',
  'openai-model',
  'openai-api-endpoint',
  'openai-api-path',
  'preview-mode',
  'iframe-url-mode',
  'hexo-project-path',
] as const;

export type SharedPanelSettings = Record<string, string>;

export function collectPanelSettings(): SharedPanelSettings {
  const settings: SharedPanelSettings = {};
  if (typeof window === 'undefined') return settings;

  for (const key of PANEL_SETTING_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) settings[key] = value;
  }
  return settings;
}

export function applyPanelSettings(settings: SharedPanelSettings): number {
  if (typeof window === 'undefined' || !settings || typeof settings !== 'object') return 0;

  let imported = 0;
  for (const key of PANEL_SETTING_KEYS) {
    const value = settings[key];
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
      imported += 1;
    }
  }
  return imported;
}

export async function saveSharedPanelSettings(): Promise<boolean> {
  if (!isDesktopApp() || typeof window === 'undefined') return false;

  try {
    const ipcRenderer = await getIpcRenderer();
    const result = await ipcRenderer.invoke(
      'write-shared-panel-settings',
      JSON.stringify(collectPanelSettings(), null, 2)
    );
    return result === true || result?.success === true;
  } catch (error) {
    console.error('保存跨版本共享面板设置失败:', error);
    return false;
  }
}

/**
 * 启动时同步：
 * - 共享文件存在：覆盖当前 WebView 的 localStorage（Electron/Tauri 自动互通）
 * - 共享文件不存在：用当前版本已有 localStorage 建立初始共享快照（兼容旧版升级）
 */
export async function importSharedPanelSettings(): Promise<number> {
  if (!isDesktopApp() || typeof window === 'undefined') return 0;

  const ipcRenderer = await getIpcRenderer();
  const raw = await ipcRenderer.invoke('read-shared-panel-settings');
  if (typeof raw !== 'string' || !raw.trim()) return 0;
  return applyPanelSettings(JSON.parse(raw) as SharedPanelSettings);
}

export async function hydrateSharedPanelSettings(): Promise<{ imported: number; initialized: boolean }> {
  if (!isDesktopApp() || typeof window === 'undefined') {
    return { imported: 0, initialized: false };
  }

  try {
    const ipcRenderer = await getIpcRenderer();
    const raw = await ipcRenderer.invoke('read-shared-panel-settings');

    if (typeof raw === 'string' && raw.trim()) {
      return { imported: await importSharedPanelSettings(), initialized: false };
    }

    // 首次迁移以 Tauri 版为数据源，避免 Electron 在共享文件不存在时反向覆盖旧 Tauri 设置。
    if (isTauri()) {
      await saveSharedPanelSettings();
      return { imported: 0, initialized: true };
    }
    return { imported: 0, initialized: false };
  } catch (error) {
    console.error('加载跨版本共享面板设置失败:', error);
    return { imported: 0, initialized: false };
  }
}
