import axiosInstance from '../api/axiosInstance';

const API_BASE = axiosInstance.defaults.baseURL?.replace(/\/+$/, '') ?? '';

function encodePath(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function resolveProfilePicSrc(profilePic) {
  if (typeof profilePic !== 'string') return null;

  const trimmed = profilePic.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalized = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return null;

  if (normalized.startsWith('uploads/')) {
    return `${API_BASE}/${encodePath(normalized)}`;
  }

  if (normalized.startsWith('profilePhoto/')) {
    return `${API_BASE}/uploads/${encodePath(normalized)}`;
  }

  return `${API_BASE}/uploads/profilePhoto/${encodePath(normalized)}`;
}
