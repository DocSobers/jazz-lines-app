export const THEME_IDS = ['slate', 'graphite', 'dusk', 'sage', 'pearl'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = 'slate';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'slate',
    label: 'Slate',
    description: 'Cool blue-gray dark (default)',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'Neutral charcoal, even tone',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    description: 'Warm brown-gray, soft contrast',
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'Muted green-gray',
  },
  {
    id: 'pearl',
    label: 'Pearl',
    description: 'Soft light gray',
  },
];

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}
