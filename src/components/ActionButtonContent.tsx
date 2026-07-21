import type { ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CircleArrowRight, Copy, Download, Dumbbell,
  LogOut, Pencil, Plus, RefreshCw, Save, Send, Share2, Trash2, Upload,
  Utensils, type LucideIcon,
} from 'lucide-react';

function iconFor(label: string): LucideIcon {
  const value = label.toLowerCase();
  if (value.includes('sign out')) return LogOut;
  if (value.includes('delete') || value.includes('remove') || value.includes('revoke')) return Trash2;
  if (value.includes('send') || value.includes('message')) return Send;
  if (value.includes('save')) return Save;
  if (value.includes('done') || value.includes('confirm') || value.includes('complete')) return Check;
  if (value.includes('add') || value.includes('create') || value.includes('generate')) return Plus;
  if (value.includes('edit')) return Pencil;
  if (value.includes('copy') || value.includes('duplicate')) return Copy;
  if (value.includes('share') || value.includes('export')) return Share2;
  if (value.includes('download')) return Download;
  if (value.includes('upload') || value.includes('import')) return Upload;
  if (value.includes('back') || value.includes('previous') || value.includes('cancel')) return ArrowLeft;
  if (value.includes('next')) return ArrowRight;
  if (value.includes('renew') || value.includes('restore') || value.includes('refresh')) return RefreshCw;
  if (value.includes('workout') || value.includes('exercise')) return Dumbbell;
  if (value.includes('diet') || value.includes('meal')) return Utensils;
  return CircleArrowRight;
}

export default function ActionButtonContent({ children, action }: { children: ReactNode; action?: string }) {
  const label = action ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : 'Action');
  const Icon = iconFor(label);
  return <><Icon className="action-button-icon" size={17} strokeWidth={2} aria-hidden="true" /><span>{children}</span></>;
}
