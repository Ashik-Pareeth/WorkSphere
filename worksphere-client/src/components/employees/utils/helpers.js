import { AVATAR_PALETTES } from '../shared/constants';

export function getGradient(id = '') {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_PALETTES[n % AVATAR_PALETTES.length];
}

export function getInitials(f = '', l = '') {
  return `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatSalary(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
