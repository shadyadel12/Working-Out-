import {
  Activity, Bell, BookOpenText, CalendarDays, CalendarRange, ChartNoAxesCombined,
  Check, ChevronLeft, ChevronRight, CircleUserRound, ClipboardCheck, ClipboardList,
  Droplets, Dumbbell, Filter, History, Images, LayoutDashboard, LibraryBig,
  MessageCircle, MessagesSquare, MoonStar, Pencil, Plus, Scale, Search, Settings,
  ShieldAlert, SlidersHorizontal, Soup, Target, TrendingUp, Upload, UsersRound,
  Utensils, type LucideIcon,
} from 'lucide-react';

export const appIcons = {
  dashboard: LayoutDashboard, clients: UsersRound, training: Dumbbell, exercises: Activity,
  workouts: ClipboardCheck, programs: CalendarRange, nutrition: Utensils, meals: Soup,
  hydration: Droplets, sleep: MoonStar, weight: Scale, analytics: ChartNoAxesCombined,
  progress: TrendingUp, messages: MessageCircle, community: MessagesSquare, library: LibraryBig,
  profile: CircleUserRound, notifications: Bell, add: Plus, upload: Upload, search: Search,
  filter: SlidersHorizontal, edit: Pencil, settings: Settings, back: ChevronLeft,
  next: ChevronRight, check: Check, history: History, calendar: CalendarDays, photo: Images,
  form: ClipboardList, goal: Target, injury: ShieldAlert, resources: BookOpenText,
  fallback: Filter,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;
export function AppLucideIcon({ name, size = 20, className }: { name: AppIconName; size?: number; className?: string }) {
  const Icon = appIcons[name];
  return <Icon aria-hidden="true" className={className} data-directional={name === 'back' || name === 'next' ? '' : undefined} size={size} strokeWidth={2} />;
}
