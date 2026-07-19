import type { SVGProps } from 'react';

export type AppIconName = 'dashboard' | 'library' | 'exercise' | 'workout' | 'program' | 'nutrition' | 'checkup' | 'messages' | 'team' | 'subscription' | 'settings' | 'support' | 'add-player' | 'arrow' | 'pulse';

const paths: Record<AppIconName, React.ReactNode> = {
  dashboard: <><path d="M4 13.5 12 6l8 7.5"/><path d="M6.5 12v8h11v-8M10 20v-5h4v5"/></>,
  library: <><path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5z"/><path d="M5 16.5A2.5 2.5 0 0 1 7.5 14H19M9 8h6"/></>,
  exercise: <><path d="M7 9v6M17 9v6M4 10.5v3M20 10.5v3M7 12h10"/><circle cx="12" cy="12" r="9" opacity=".18"/></>,
  workout: <><path d="M6 5h12v14H6zM9 9h6M9 13h6M9 17h3"/><path d="m16 5 2 2"/></>,
  program: <><path d="M5 6.5h14M7 4v5M17 4v5M5 10h14v10H5z"/><path d="m9 15 2 2 4-5"/></>,
  nutrition: <><path d="M12 20V10"/><path d="M12 13c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Z"/><path d="M12 16c4.5 0 7-2.5 7-7-4.5 0-7 2.5-7 7Z"/></>,
  checkup: <><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.5 2.2 2.2 4.8-5"/></>,
  messages: <><path d="M4.5 5.5h15v11h-9l-4 3v-3h-2z"/><path d="M8 9.5h8M8 12.5h5"/></>,
  team: <><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5M15 15c2.8 0 4.5 1.3 5 4"/></>,
  subscription: <><path d="M4.5 7h15v11h-15zM4.5 10h15"/><path d="M8 15h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/></>,
  support: <><circle cx="12" cy="12" r="9"/><path d="M8 15.5v-7M16 15.5v-7M8 9c1-2 2.3-3 4-3s3 1 4 3M8 15c1 2 2.3 3 4 3s3-1 4-3"/></>,
  'add-player': <><circle cx="9" cy="8" r="3"/><path d="M3.5 18c.5-3.5 2.3-5.3 5.5-5.3 1.7 0 3 .5 4 1.4M17.5 12v7M14 15.5h7"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  pulse: <path d="M3 13h4l2-6 4 11 2.5-7H21"/>,
};

export default function AppIcon({ name, size = 18, ...props }: { name: AppIconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
