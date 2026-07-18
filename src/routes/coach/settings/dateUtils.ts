/** Date helpers used by coach subscription-key settings. */
import type { CoachPlayerLink } from '../../../types/database.types';

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function isExpired(link: CoachPlayerLink) {
  return new Date(link.subscription_end_date) < new Date();
}

export function monthsFromToday(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
