export type AppThemeName = 'system' | 'light' | 'dark' | 'ocean' | 'forest' | 'sunset';

export interface AppThemeOption {
  name: AppThemeName;
  label: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  accent: string;
  preview: {
    background: string;
    foreground: string;
    primary: string;
  };
  dark: boolean | 'system';
}

export const APP_THEME_STORAGE_KEY = 'app-theme';

export const APP_THEME_OPTIONS: AppThemeOption[] = [
  {
    name: 'system',
    label: {
      zh: '跟随系统',
      en: 'System',
    },
    description: {
      zh: '根据系统外观自动切换明亮/黑夜模式',
      en: 'Follow the operating system appearance',
    },
    accent: '#64748b',
    preview: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #0f172a 100%)',
      foreground: '#f8fafc',
      primary: '#64748b',
    },
    dark: 'system',
  },
  {
    name: 'light',
    label: {
      zh: '明亮',
      en: 'Light',
    },
    description: {
      zh: '简洁清爽的浅色主题',
      en: 'Clean and bright light theme',
    },
    accent: '#111827',
    preview: {
      background: '#ffffff',
      foreground: '#111827',
      primary: '#111827',
    },
    dark: false,
  },
  {
    name: 'dark',
    label: {
      zh: '黑夜',
      en: 'Dark',
    },
    description: {
      zh: '适合夜间写作的深色主题',
      en: 'Dark theme for night writing',
    },
    accent: '#e5e7eb',
    preview: {
      background: '#111827',
      foreground: '#f9fafb',
      primary: '#e5e7eb',
    },
    dark: true,
  },
  {
    name: 'ocean',
    label: {
      zh: '深海',
      en: 'Ocean',
    },
    description: {
      zh: '蓝紫渐变的沉浸式深色主题',
      en: 'Immersive blue-purple dark theme',
    },
    accent: '#38bdf8',
    preview: {
      background: 'linear-gradient(135deg, #082f49 0%, #312e81 100%)',
      foreground: '#e0f2fe',
      primary: '#38bdf8',
    },
    dark: true,
  },
  {
    name: 'forest',
    label: {
      zh: '森林',
      en: 'Forest',
    },
    description: {
      zh: '柔和绿色的专注写作主题',
      en: 'Soft green focus writing theme',
    },
    accent: '#16a34a',
    preview: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      foreground: '#052e16',
      primary: '#16a34a',
    },
    dark: false,
  },
  {
    name: 'sunset',
    label: {
      zh: '日落',
      en: 'Sunset',
    },
    description: {
      zh: '温暖橙粉色的轻松主题',
      en: 'Warm orange-pink relaxed theme',
    },
    accent: '#f97316',
    preview: {
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffe4e6 100%)',
      foreground: '#431407',
      primary: '#f97316',
    },
    dark: false,
  },
];

const APP_THEME_NAMES = new Set<AppThemeName>(APP_THEME_OPTIONS.map((theme) => theme.name));
const QUICK_THEME_CYCLE: AppThemeName[] = ['light', 'dark', 'ocean', 'forest', 'sunset'];

export const isAppThemeName = (value: unknown): value is AppThemeName => (
  typeof value === 'string' && APP_THEME_NAMES.has(value as AppThemeName)
);

export const getAppThemeOption = (themeName: AppThemeName) => (
  APP_THEME_OPTIONS.find((theme) => theme.name === themeName) || APP_THEME_OPTIONS[0]
);

export const getStoredAppTheme = (): AppThemeName => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  return isAppThemeName(storedTheme) ? storedTheme : 'system';
};

export const storeAppTheme = (themeName: AppThemeName) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_THEME_STORAGE_KEY, themeName);
};

export const resolveAppTheme = (themeName: AppThemeName, prefersDark?: boolean): Exclude<AppThemeName, 'system'> => {
  if (themeName !== 'system') {
    return themeName;
  }

  const systemPrefersDark = prefersDark ?? (
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  return systemPrefersDark ? 'dark' : 'light';
};

export const isAppThemeDark = (themeName: AppThemeName) => {
  const themeOption = getAppThemeOption(themeName);

  if (themeOption.dark === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return themeOption.dark;
};

export const applyAppTheme = (themeName: AppThemeName, root: HTMLElement | null = null) => {
  if (typeof document === 'undefined') {
    return resolveAppTheme(themeName, false);
  }

  const targetRoot = root || document.documentElement;
  const appliedTheme = resolveAppTheme(themeName);

  targetRoot.dataset.appTheme = appliedTheme;
  targetRoot.classList.toggle('dark', isAppThemeDark(appliedTheme));
  targetRoot.style.colorScheme = isAppThemeDark(appliedTheme) ? 'dark' : 'light';

  const themeColor = getAppThemeOption(appliedTheme).preview.background;
  const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaThemeColor && !themeColor.startsWith('linear-gradient')) {
    metaThemeColor.content = themeColor;
  }

  return appliedTheme;
};

export const setAppTheme = (themeName: AppThemeName) => {
  storeAppTheme(themeName);
  return applyAppTheme(themeName);
};

export const getNextAppTheme = (currentTheme: AppThemeName): AppThemeName => {
  const resolvedTheme = currentTheme === 'system' ? resolveAppTheme(currentTheme) : currentTheme;
  const currentIndex = QUICK_THEME_CYCLE.indexOf(resolvedTheme);
  return QUICK_THEME_CYCLE[(currentIndex + 1) % QUICK_THEME_CYCLE.length];
};
