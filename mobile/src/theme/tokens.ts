export const lightColors = {
  brand50: '#eaf8f6', brand100: '#d8f2ef', brand500: '#26b8aa', brand600: '#1fa094', brand700: '#168f84',
  ink950: '#26343d', ink700: '#405159', ink500: '#75838b', line: '#dfe7e9', surface: '#ffffff', surfaceSubtle: '#f6f8fa',
  success: '#21a875', warning: '#e9a72f', danger: '#e65363', tabBar: '#ffffff', overlay: 'rgba(38,52,61,.42)',
} as const;

export const darkColors = {
  brand50: '#3c251b', brand100: '#57301d', brand500: '#f9702b', brand600: '#ff8247', brand700: '#ff9b68',
  ink950: '#f4f4f5', ink700: '#d4d4d8', ink500: '#9d9da6', line: '#333338', surface: '#1b1b1d', surfaceSubtle: '#121212',
  success: '#22c55e', warning: '#fbbf24', danger: '#f45860', tabBar: '#1b1b1d', overlay: 'rgba(0,0,0,.68)',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, jumbo: 40 } as const;
export const radii = { sm: 8, md: 12, lg: 16, sheet: 24, pill: 999 } as const;
export const sizes = { minimumTarget: 44, searchHeight: 44, rowMinHeight: 64, tabIcon: 22, actionIcon: 20, rowIcon: 18, maxDetailWidth: 720 } as const;
export const motion = { tabCrossfadeMs: 140, pushMs: 260, sheetMs: 300, pressScale: 0.98 } as const;
