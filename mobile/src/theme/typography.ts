import type { TextStyle } from 'react-native';

export const typography = {
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  navigationTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  metadata: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyle>;
