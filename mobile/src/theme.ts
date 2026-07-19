import { Appearance } from 'react-native';

const dark = Appearance.getColorScheme() !== 'light';
export const colors = dark
  ? { background:'#121212',surface:'#1b1b1d',surfaceRaised:'#242427',surfaceSoft:'#242427',border:'#333338',text:'#f4f4f5',muted:'#9d9da6',accent:'#f9702b',accent2:'#f9702b',accentSoft:'#3c251b',danger:'#f45860',success:'#22c55e',warning:'#fbbf24',vip:'#ffc45c' }
  : { background:'#f6f8fa',surface:'#ffffff',surfaceRaised:'#ffffff',surfaceSoft:'#f3f6f7',border:'#dfe7e9',text:'#26343d',muted:'#75838b',accent:'#26b8aa',accent2:'#26b8aa',accentSoft:'#eaf8f6',danger:'#e65363',success:'#21a875',warning:'#e9a72f',vip:'#b77900' };
export const spacing={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32};
export const radius={sm:8,md:12,lg:18,xl:24,pill:999};
