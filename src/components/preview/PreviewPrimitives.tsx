import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AppLucideIcon, type AppIconName } from '../../design-system/icon-registry';
import { featureTheme } from '../../design-system/feature-theme';

export function FeatureIcon({ name, feature = 'analytics' }: { name: AppIconName; feature?: keyof typeof featureTheme }) {
  const tone = featureTheme[feature];
  return <span className="preview-feature-icon" style={{ color: tone.color, background: tone.soft }}><AppLucideIcon name={name} size={22} /></span>;
}
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <header className="preview-page-header"><div>{eyebrow && <span className="preview-eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function MetricCard({ icon, feature, value, label, detail }: { icon: AppIconName; feature: keyof typeof featureTheme; value: string; label: string; detail: string }) {
  return <article className="preview-card preview-metric"><FeatureIcon name={icon} feature={feature} /><div><strong>{value}</strong><span>{label}</span><small>{detail}</small></div></article>;
}
export function StatusBadge({ tone, children }: { tone: 'green' | 'yellow' | 'pink' | 'blue'; children: ReactNode }) {
  return <span className={`preview-status preview-status-${tone}`}><span aria-hidden="true" />{children}</span>;
}
export function IconButton({ label, icon, ...props }: { label: string; icon: AppIconName } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="preview-icon-button" aria-label={label} title={label} {...props}><AppLucideIcon name={icon} /></button>;
}
export function SearchField({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="preview-search"><span className="sr-only">{label}</span><AppLucideIcon name="search" size={18} /><input type="search" placeholder={placeholder} /></label>;
}
