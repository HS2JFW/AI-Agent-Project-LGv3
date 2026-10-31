/**
 * ==============================================================================
 * BUILDER THEME - Design System Tokens & Configuration
 * ==============================================================================
 * Official Theme Specification for AI Builder Project ("Builder Theme").
 * Design Language: LiteLLM Admin UI / shadcn/ui / Vercel Enterprise
 * ==============================================================================
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  canvasBg: string;
  canvasDots: string;
  headerBg: string;
  sidebarBg: string;
  cardBg: string;
  cardHeaderBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardBorderSelected: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderDivider: string;
  edgeIdle: string;
  edgeActive: string;
  navActiveBg: string;
  navActiveBorder: string;
  navActiveText: string;
  navActiveIcon: string;
  navInactiveText: string;
}

export const BUILDER_THEME = {
  name: 'builder-theme',
  displayName: 'Builder Theme',
  version: '1.0.0',
  description: 'Enterprise AI visual workflow design system inspired by LiteLLM and shadcn/ui',
  layout: {
    sidebarExpandedWidth: '14rem', // 224px (w-56)
    sidebarCollapsedWidth: '4rem', // 64px (w-16)
    headerHeight: '3.5rem', // 56px (h-14)
    canvasGridSize: 24, // 24px dot spacing
  },
  colors: {
    dark: {
      canvasBg: '#09090b', // zinc-950
      canvasDots: '#27272a', // zinc-800
      headerBg: '#121215',
      sidebarBg: '#101014',
      cardBg: '#141418',
      cardHeaderBg: 'rgba(24, 24, 27, 0.6)',
      cardBorder: '#27272a', // zinc-800
      cardBorderHover: '#3f3f46', // zinc-700
      cardBorderSelected: '#6366f1', // indigo-500
      textPrimary: '#f4f4f5', // zinc-100
      textSecondary: '#a1a1aa', // zinc-400
      textMuted: '#71717a', // zinc-500
      borderSubtle: '#27272a',
      borderDivider: '#27272a',
      edgeIdle: '#3f3f46',
      edgeActive: '#6366f1',
      navActiveBg: 'rgba(99, 102, 241, 0.15)',
      navActiveBorder: 'rgba(99, 102, 241, 0.3)',
      navActiveText: '#ffffff',
      navActiveIcon: '#818cf8',
      navInactiveText: '#a1a1aa',
    },
    light: {
      canvasBg: '#fafafa', // zinc-50
      canvasDots: '#d4d4d8', // zinc-300
      headerBg: '#ffffff',
      sidebarBg: '#ffffff',
      cardBg: '#ffffff',
      cardHeaderBg: '#fafafa',
      cardBorder: '#e4e4e7', // zinc-200
      cardBorderHover: '#d4d4d8', // zinc-300
      cardBorderSelected: '#6366f1', // indigo-500
      textPrimary: '#09090b', // zinc-950 (high-contrast)
      textSecondary: '#71717a', // zinc-500
      textMuted: '#a1a1aa', // zinc-400
      borderSubtle: '#e4e4e7',
      borderDivider: '#e4e4e7',
      edgeIdle: '#94a3b8',
      edgeActive: '#4f46e5',
      navActiveBg: '#f4f4f5', // zinc-100
      navActiveBorder: '#e4e4e7',
      navActiveText: '#09090b', // bold deep black
      navActiveIcon: '#4f46e5',
      navInactiveText: '#52525b',
    },
  },
  badges: {
    input: {
      dark: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      light: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
    aiSpecialist: {
      dark: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      light: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    lakehouse: {
      dark: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      light: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    output: {
      dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  },
} as const;

export const THEME_STORAGE_KEY = 'ai_builder_theme';
export const SIDEBAR_STORAGE_KEY = 'ai_builder_sidebar_collapsed';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // fallback
  }
  return 'dark';
}

export function applyBuilderTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    body.classList.remove('light-mode');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    body.classList.add('light-mode');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage not available
  }
}
