import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  X,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  ChevronRight,
  Pencil,
  TrendingUp,
  ShieldOff,
  ShieldCheck,
  Save,
  Loader2,
  AlertTriangle,
  Search,
  Lock,
  ClipboardList,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Google Fonts + global classic-light tokens ── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap');

  :root {
    --cream:        #faf9f6;
    --paper:        #f4f2ed;
    --white:        #ffffff;
    --border:       #e4dfd7;
    --border-md:    #d4cec6;
    --text-1:       #1c1917;
    --text-2:       #57534e;
    --text-3:       #a8a29e;
    --accent:       #2563eb;
    --accent-light: #eff6ff;
    --shadow-sm:    0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md:    0 4px 12px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
    --shadow-lg:    0 20px 48px rgba(0,0,0,.13), 0 8px 20px rgba(0,0,0,.08);
    --radius-sm:    8px;
    --radius-md:    12px;
    --radius-lg:    18px;
    --font-serif:   'Libre Baskerville', Georgia, serif;
    --font-sans:    'Source Sans 3', system-ui, sans-serif;
  }

  .el-root * { box-sizing: border-box; }
  .el-root { font-family: var(--font-sans); background: var(--cream); color: var(--text-1); }

  /* ── Page layout ── */
  .el-page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }

  /* ── Page header ── */
  .el-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 22px;
  }
  .el-page-header-left { display: flex; align-items: center; gap: 14px; }
  .el-icon-box {
    width: 44px; height: 44px;
    border-radius: var(--radius-sm);
    background: var(--text-1);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .el-page-title {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text-1);
    margin: 0 0 2px;
    line-height: 1.2;
  }
  .el-page-subtitle { font-size: 13px; color: var(--text-3); margin: 0; }

  /* ── Search / filter bar ── */
  .el-filter-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
  .el-search-wrap { position: relative; flex: 1; min-width: 220px; }
  .el-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .el-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-3); padding: 0; display: flex; }
  .el-search-clear:hover { color: var(--text-2); }

  .el-input, .el-select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13.5px;
    font-family: var(--font-sans);
    background: var(--white);
    color: var(--text-1);
    transition: border-color .15s, box-shadow .15s;
    box-shadow: var(--shadow-sm);
    outline: none;
  }
  .el-input:focus, .el-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  }
  .el-search-input { padding-left: 34px; padding-right: 30px; }
  .el-select-wrap { position: relative; width: 188px; }
  .el-select-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .el-select { padding-left: 30px; appearance: none; cursor: pointer; }

  .el-clear-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 9px 12px;
    border: 1px solid #fca5a5;
    border-radius: var(--radius-sm);
    background: var(--white);
    color: #dc2626;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    white-space: nowrap;
    transition: background .12s;
    box-shadow: var(--shadow-sm);
  }
  .el-clear-btn:hover { background: #fff5f5; }

  .el-result-count { font-size: 12px; color: var(--text-3); margin-bottom: 14px; }

  /* ── Table card ── */
  .el-table-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .el-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .el-thead { background: var(--paper); border-bottom: 1px solid var(--border-md); }
  .el-th {
    padding: 11px 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: var(--text-3);
    text-align: left;
    white-space: nowrap;
  }
  .el-tr { border-bottom: 1px solid var(--border); transition: background .1s; cursor: pointer; }
  .el-tr:last-child { border-bottom: none; }
  .el-tr:hover { background: var(--accent-light); }
  .el-tr:hover .el-chevron { color: var(--accent); }
  .el-td { padding: 13px 20px; color: var(--text-2); vertical-align: middle; }
  .el-td-name { color: var(--text-1); font-weight: 600; }

  .el-avatar {
    width: 32px; height: 32px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }
  .el-avatar-initials {
    width: 32px; height: 32px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    letter-spacing: .03em;
  }
  .el-name-cell { display: flex; align-items: center; gap: 11px; }
  .el-chevron { color: var(--border-md); transition: color .12s; }

  .el-empty { padding: 52px 20px; text-align: center; color: var(--text-3); font-size: 13.5px; }

  /* ── Pills / badges ── */
  .el-pill {
    display: inline-flex; align-items: center;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .02em;
    box-shadow: 0 0 0 1px currentColor;
  }

  /* ── Modal overlay ── */
  .el-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(28,25,23,.5);
    backdrop-filter: blur(5px);
    animation: elFadeIn .18s ease;
  }
  @keyframes elFadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes elSlideUp { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: none } }

  .el-modal {
    position: relative;
    width: 100%;
    max-width: 520px;
    background: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    margin: auto;
    animation: elSlideUp .2s ease;
    overflow: hidden;
  }

  /* Modal hero banner */
  .el-modal-hero {
    height: 110px;
    position: relative;
    margin-bottom: 56px;
  }
  .el-modal-hero-pattern {
    position: absolute; inset: 0; opacity: .08;
  }
  .el-modal-close {
    position: absolute; top: 12px; right: 12px;
    background: rgba(255,255,255,.25);
    border: none; border-radius: 50%;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff;
    transition: background .12s;
  }
  .el-modal-close:hover { background: rgba(255,255,255,.45); }

  .el-modal-avatar-wrap {
    position: absolute;
    left: 50%; transform: translateX(-50%);
    bottom: -44px;
  }
  .el-modal-avatar {
    width: 88px; height: 88px;
    border-radius: var(--radius-md);
    object-fit: cover;
    border: 4px solid var(--white);
    box-shadow: var(--shadow-md);
  }
  .el-modal-avatar-initials {
    width: 88px; height: 88px;
    border-radius: var(--radius-md);
    border: 4px solid var(--white);
    box-shadow: var(--shadow-md);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -.01em;
  }

  /* Modal identity block */
  .el-modal-identity { text-align: center; padding: 0 24px 8px; }
  .el-modal-name {
    font-family: var(--font-serif);
    font-size: 19px; font-weight: 700;
    color: var(--text-1); margin: 0 0 3px;
    letter-spacing: -.01em;
  }
  .el-modal-jobtitle { font-size: 13px; color: var(--text-3); margin: 0 0 10px; }
  .el-modal-roles { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; }

  /* Tab bar */
  .el-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 20px; gap: 2px; }
  .el-tab {
    display: flex; align-items: center; gap: 5px;
    padding: 10px 12px;
    font-size: 12px; font-weight: 600;
    font-family: var(--font-sans);
    background: none; border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    color: var(--text-3);
    transition: color .12s, border-color .12s;
    white-space: nowrap;
  }
  .el-tab:hover:not(.el-tab--dim) { color: var(--text-2); }
  .el-tab--active { border-bottom-color: var(--accent); color: var(--accent) !important; }
  .el-tab--dim { color: #d4cfc9; cursor: default; }
  .el-tab-refreshing { margin-left: auto; display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-3); padding-right: 4px; }

  /* Tab body */
  .el-tab-body { padding: 22px 24px 24px; }

  /* Detail rows (View tab) */
  .el-detail-list { background: var(--paper); border-radius: var(--radius-sm); overflow: hidden; }
  .el-detail-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--border);
  }
  .el-detail-row:last-child { border-bottom: none; }
  .el-detail-icon {
    margin-top: 2px; padding: 6px;
    border-radius: 7px;
    background: var(--white);
    border: 1px solid var(--border);
    color: var(--text-3);
    flex-shrink: 0;
  }
  .el-detail-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); margin-bottom: 2px; }
  .el-detail-value { font-size: 13px; font-weight: 600; color: var(--text-1); }

  /* Form elements */
  .el-field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); margin-bottom: 5px; }
  .el-form-input, .el-form-select {
    width: 100%;
    padding: 8px 11px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-family: var(--font-sans);
    background: var(--white);
    color: var(--text-1);
    transition: border-color .14s, box-shadow .14s;
    outline: none;
  }
  .el-form-input:focus, .el-form-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }
  .el-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .el-form-space { display: flex; flex-direction: column; gap: 14px; }

  /* Save button */
  .el-save-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px;
    border: none; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 700;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: filter .15s, opacity .15s;
    letter-spacing: .02em;
  }
  .el-save-btn:disabled { opacity: .55; cursor: not-allowed; }
  .el-save-btn:not(:disabled):hover { filter: brightness(.93); }
  .el-save-btn--blue  { background: var(--accent); color: #fff; }
  .el-save-btn--amber { background: #d97706; color: #fff; }
  .el-save-btn--red   { background: #dc2626; color: #fff; }
  .el-save-btn--green { background: #059669; color: #fff; }

  /* Toast strip */
  .el-toast {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 600;
    margin-bottom: 14px;
    border: 1px solid;
  }
  .el-toast--success { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
  .el-toast--error   { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

  /* Permission banner */
  .el-permission-banner { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 36px 16px; text-align: center; }
  .el-permission-icon { padding: 12px; border-radius: 50%; background: var(--paper); }
  .el-permission-title { font-size: 13px; font-weight: 700; color: var(--text-2); margin: 0; }
  .el-permission-sub { font-size: 12px; color: var(--text-3); margin: 0; }

  /* Info banner */
  .el-info-banner {
    display: flex; gap: 8px;
    padding: 11px 13px;
    border-radius: var(--radius-sm);
    border: 1px solid;
    font-size: 12px; font-weight: 500;
    margin-bottom: 14px;
  }
  .el-info-banner--amber { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  .el-info-banner--red   { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
  .el-info-banner--green { background: #f0fdf4; border-color: #bbf7d0; color: #14532d; }

  /* Role toggle chips */
  .el-role-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .el-role-chip {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11.5px; font-weight: 700;
    cursor: pointer; border: none;
    font-family: var(--font-sans);
    transition: opacity .12s, box-shadow .12s;
    box-shadow: 0 0 0 1px currentColor;
  }
  .el-role-chip:hover { opacity: .85; }
  .el-role-chip--off { background: var(--paper); color: var(--text-3); box-shadow: 0 0 0 1px var(--border-md); }

  /* Status grid */
  .el-status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .el-status-btn {
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 700;
    font-family: var(--font-sans);
    text-align: left; cursor: pointer; border: none;
    transition: opacity .12s;
    box-shadow: 0 0 0 1px currentColor;
  }
  .el-status-btn:hover { opacity: .85; }
  .el-status-btn--off { background: var(--paper); color: var(--text-3); box-shadow: 0 0 0 1px var(--border-md); }

  /* Attendance table */
  .el-att-table { width: 100%; font-size: 12px; border-collapse: collapse; }
  .el-att-th { padding: 8px 8px; background: var(--paper); border-bottom: 1px solid var(--border-md); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); text-align: left; }
  .el-att-td { padding: 9px 8px; border-bottom: 1px solid var(--border); color: var(--text-2); }
  .el-att-tr:hover td { background: var(--paper); }
  .el-att-badge { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; }

  /* hint text */
  .el-hint { font-size: 11px; color: var(--text-3); margin-top: 3px; }

  /* Skeleton shimmer */
  @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
  .el-skeleton { border-radius: 6px; background: var(--border); animation: shimmer 1.4s ease infinite; }
`;

/* ═══════════════════════════════════════════════════════════════
   ROLE HIERARCHY
═══════════════════════════════════════════════════════════════ */
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  HR: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
  AUDITOR: 0,
};

function getHighestRole(roles = []) {
  const names = roles.map((r) => (typeof r === 'string' ? r : r.roleName));
  return names.reduce((best, r) => {
    if (!best) return r;
    return (ROLE_HIERARCHY[r] ?? -1) > (ROLE_HIERARCHY[best] ?? -1) ? r : best;
  }, null);
}
function canManage(viewerRank, targetRoles = []) {
  const targetHighest = getHighestRole(targetRoles);
  const targetRank = ROLE_HIERARCHY[targetHighest] ?? 1;
  return viewerRank > targetRank;
}
function assignableRoles(allRoles = [], viewerRank) {
  return allRoles.filter(
    (r) => (ROLE_HIERARCHY[r.roleName] ?? -1) < viewerRank
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const STATUSES = [
  'ACTIVE',
  'PENDING',
  'PROBATION',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
  'INACTIVE',
];

const STATUS_STYLE = {
  ACTIVE: { bg: '#d1fae5', color: '#065f46', shadow: '#6ee7b7' },
  PENDING: { bg: '#fef9c3', color: '#713f12', shadow: '#fde047' },
  PROBATION: { bg: '#dbeafe', color: '#1e3a8a', shadow: '#93c5fd' },
  SUSPENDED: { bg: '#fee2e2', color: '#7f1d1d', shadow: '#fca5a5' },
  TERMINATED: { bg: '#f3f4f6', color: '#374151', shadow: '#d1d5db' },
  RESIGNED: { bg: '#ffedd5', color: '#7c2d12', shadow: '#fdba74' },
  INACTIVE: { bg: '#f3f4f6', color: '#6b7280', shadow: '#d1d5db' },
};

const ROLE_STYLE = {
  SUPER_ADMIN: { bg: '#fee2e2', color: '#991b1b' },
  HR: { bg: '#ede9fe', color: '#5b21b6' },
  MANAGER: { bg: '#fef3c7', color: '#92400e' },
  EMPLOYEE: { bg: '#e0f2fe', color: '#075985' },
  AUDITOR: { bg: '#ccfbf1', color: '#134e4a' },
};

const AVATAR_PALETTES = [
  ['#3b5998', '#2d4373'],
  ['#059669', '#047857'],
  ['#dc2626', '#b91c1c'],
  ['#7c3aed', '#6d28d9'],
  ['#db2777', '#be185d'],
  ['#d97706', '#b45309'],
];
function getGradient(id = '') {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_PALETTES[n % AVATAR_PALETTES.length];
}
function getInitials(f = '', l = '') {
  return `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
function formatSalary(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

const API_BASE = axiosInstance.defaults.baseURL?.replace(/\/+$/, '') ?? '';

/* ═══════════════════════════════════════════════════════════════
   SMALL UI ATOMS
═══════════════════════════════════════════════════════════════ */
function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? {
    bg: '#f3f4f6',
    color: '#374151',
    shadow: '#d1d5db',
  };
  return (
    <span
      className="el-pill"
      style={{
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 0 1px ${s.shadow}`,
      }}
    >
      {status}
    </span>
  );
}

function RolePill({ roleName }) {
  const s = ROLE_STYLE[roleName] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      className="el-pill"
      style={{
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 0 1px ${s.color}33`,
      }}
    >
      {roleName.replace('_', ' ')}
    </span>
  );
}

function Avatar({ emp, size = 32 }) {
  const [colors] = useState(() => getGradient(emp.id));
  const profileSrc = emp.profilePic
    ? `${API_BASE}/uploads/profilePhoto/${emp.profilePic}`
    : null;
  if (profileSrc) {
    return (
      <img
        src={profileSrc}
        alt={emp.firstName}
        className="el-avatar"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="el-avatar-initials"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      {getInitials(emp.firstName, emp.lastName)}
    </div>
  );
}

function ModalAvatar({ emp }) {
  const [colors] = useState(() => getGradient(emp.id));
  const profileSrc = emp.profilePic
    ? `${API_BASE}/uploads/profilePhoto/${emp.profilePic}`
    : null;
  if (profileSrc)
    return (
      <img src={profileSrc} alt={emp.firstName} className="el-modal-avatar" />
    );
  return (
    <div
      className="el-modal-avatar-initials"
      style={{
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      {getInitials(emp.firstName, emp.lastName)}
    </div>
  );
}

function ElToast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`el-toast el-toast--${type}`}>
      {type === 'error' ? (
        <AlertTriangle size={13} />
      ) : (
        <ShieldCheck size={13} />
      )}
      {msg}
    </div>
  );
}

function PermissionBanner({ message }) {
  return (
    <div className="el-permission-banner">
      <div className="el-permission-icon">
        <Lock size={20} color="var(--text-3)" />
      </div>
      <p className="el-permission-title">{message}</p>
      <p className="el-permission-sub">
        You do not have sufficient permissions to perform this action.
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="el-field-label">{children}</label>;
}

function FormInput({ ...props }) {
  return <input className="el-form-input" {...props} />;
}

function FormSelect({ children, ...props }) {
  return (
    <select className="el-form-select" {...props}>
      {children}
    </select>
  );
}

function SaveBtn({ loading, label = 'Save Changes', color = 'blue' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`el-save-btn el-save-btn--${color}`}
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Save size={14} />
      )}
      {loading ? 'Saving…' : label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: VIEW
═══════════════════════════════════════════════════════════════ */
function ViewTab({ emp }) {
  const rows = [
    { Icon: Mail, label: 'Email', value: emp.email },
    { Icon: Building2, label: 'Department', value: emp.departmentName },
    { Icon: User, label: 'Reports To', value: emp.managerName },
    { Icon: DollarSign, label: 'Salary', value: formatSalary(emp.salary) },
    {
      Icon: Clock,
      label: 'Work Schedule',
      value: emp.workSchedule?.scheduleName,
    },
    { Icon: Calendar, label: 'Joined', value: formatDate(emp.joiningDate) },
  ];
  return (
    <div className="el-detail-list">
      {rows.map(({ Icon, label, value }) => (
        <div key={label} className="el-detail-row">
          <div className="el-detail-icon">
            <Icon size={13} />
          </div>
          <div>
            <div className="el-detail-label">{label}</div>
            <div className="el-detail-value">{value ?? '—'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: EDIT
═══════════════════════════════════════════════════════════════ */
function EditTab({ emp, onSaved, viewerRank }) {
  if (!canManage(viewerRank, emp.roles))
    return (
      <PermissionBanner message="You cannot edit this employee's profile." />
    );

  const [form, setForm] = useState({
    firstName: emp.firstName ?? '',
    lastName: emp.lastName ?? '',
    email: emp.email ?? '',
    username: emp.username ?? '',
    salary: emp.salary ?? '',
    password: '',
    Id: emp.departmentId ?? '',
    jobPositionId: emp.jobPositionId ?? '',
    managerId: emp.managerId ?? '',
    workScheduleId: emp.workSchedule?.id ?? '',
    roles: emp.roles?.map((r) => r.id) ?? [],
  });
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/departments'),
      axiosInstance.get('/jobPositions'),
      axiosInstance.get('/api/work-schedules'),
      axiosInstance.get('/employees'),
      axiosInstance.get('/roles'),
    ])
      .then(([d, p, s, e, r]) => {
        setDepts(d.data);
        setPositions(p.data);
        setSchedules(s.data);
        setManagers(e.data.filter((x) => x.id !== emp.id));
        setAllRoles(assignableRoles(r.data, viewerRank));
      })
      .catch(() =>
        setToast({ msg: 'Failed to load form data', type: 'error' })
      );
  }, [emp.id, viewerRank]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (id) =>
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(id)
        ? f.roles.filter((r) => r !== id)
        : [...f.roles, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      await axiosInstance.put(`/employees/${emp.id}`, {
        ...form,
        salary: Number(form.salary),
        Id: form.Id || null,
        jobPositionId: form.jobPositionId || null,
        managerId: form.managerId || null,
        workScheduleId: form.workScheduleId || null,
        roles: form.roles.length ? form.roles : undefined,
        password: form.password || undefined,
      });
      setToast({ msg: 'Employee updated successfully', type: 'success' });
      onSaved();
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message ?? 'Update failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="el-form-space">
      <ElToast msg={toast?.msg} type={toast?.type} />
      <div className="el-form-grid-2">
        <div>
          <FieldLabel>First Name</FieldLabel>
          <FormInput
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Last Name</FieldLabel>
          <FormInput
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="el-form-grid-2">
        <div>
          <FieldLabel>Email</FieldLabel>
          <FormInput
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Username</FieldLabel>
          <FormInput
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
          />
        </div>
      </div>
      <div className="el-form-grid-2">
        <div>
          <FieldLabel>Salary</FieldLabel>
          <FormInput
            type="number"
            value={form.salary}
            onChange={(e) => set('salary', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>New Password</FieldLabel>
          <FormInput
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Leave blank to keep"
          />
        </div>
      </div>
      <div>
        <FieldLabel>Department</FieldLabel>
        <FormSelect value={form.Id} onChange={(e) => set('Id', e.target.value)}>
          <option value="">— None —</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FieldLabel>Job Position</FieldLabel>
        <FormSelect
          value={form.jobPositionId}
          onChange={(e) => set('jobPositionId', e.target.value)}
        >
          <option value="">— None —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.positionName}
            </option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FieldLabel>Manager</FieldLabel>
        <FormSelect
          value={form.managerId}
          onChange={(e) => set('managerId', e.target.value)}
        >
          <option value="">— None —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FieldLabel>Work Schedule</FieldLabel>
        <FormSelect
          value={form.workScheduleId}
          onChange={(e) => set('workScheduleId', e.target.value)}
        >
          <option value="">— None —</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.scheduleName}
            </option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FieldLabel>
          Roles{' '}
          <span
            className="el-hint"
            style={{ textTransform: 'none', letterSpacing: 0 }}
          >
            (only roles below your level)
          </span>
        </FieldLabel>
        {allRoles.length === 0 ? (
          <p className="el-hint" style={{ fontStyle: 'italic' }}>
            No assignable roles at your permission level.
          </p>
        ) : (
          <div className="el-role-chips">
            {allRoles.map((r) => {
              const active = form.roles.includes(r.id);
              const s = ROLE_STYLE[r.roleName] ?? {
                bg: '#e5e7eb',
                color: '#374151',
              };
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`el-role-chip ${active ? '' : 'el-role-chip--off'}`}
                  style={
                    active
                      ? {
                          background: s.bg,
                          color: s.color,
                          boxShadow: `0 0 0 1px ${s.color}44`,
                        }
                      : {}
                  }
                >
                  {r.roleName}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <SaveBtn loading={loading} color="blue" />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PROMOTE
═══════════════════════════════════════════════════════════════ */
function PromoteTab({ emp, onSaved, viewerRank }) {
  if (!canManage(viewerRank, emp.roles))
    return <PermissionBanner message="You cannot promote this employee." />;

  const [form, setForm] = useState({
    jobPositionId: emp.jobPositionId ?? '',
    salary: emp.salary ?? '',
    managerId: emp.managerId ?? '',
  });
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/jobPositions'),
      axiosInstance.get('/employees'),
    ])
      .then(([p, e]) => {
        setPositions(p.data);
        setManagers(e.data.filter((x) => x.id !== emp.id));
      })
      .catch(() => setToast({ msg: 'Failed to load data', type: 'error' }));
  }, [emp.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      await axiosInstance.put(`/employees/${emp.id}`, {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        username: emp.username,
        salary: Number(form.salary),
        Id: emp.departmentId ?? null,
        jobPositionId: form.jobPositionId || null,
        managerId: form.managerId || null,
        workScheduleId: emp.workSchedule?.id ?? null,
        roles: emp.roles?.map((r) => r.id),
      });
      setToast({ msg: 'Promotion saved successfully', type: 'success' });
      onSaved();
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message ?? 'Promotion failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="el-form-space">
      <ElToast msg={toast?.msg} type={toast?.type} />
      <div className="el-info-banner el-info-banner--amber">
        <TrendingUp size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        Updating job position, salary, and reporting line for {
          emp.firstName
        }{' '}
        {emp.lastName}.
      </div>
      <div>
        <FieldLabel>New Job Position</FieldLabel>
        <FormSelect
          value={form.jobPositionId}
          onChange={(e) => set('jobPositionId', e.target.value)}
        >
          <option value="">— Keep current —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.positionName}
            </option>
          ))}
        </FormSelect>
        {emp.jobTitle && <p className="el-hint">Current: {emp.jobTitle}</p>}
      </div>
      <div>
        <FieldLabel>New Salary</FieldLabel>
        <FormInput
          type="number"
          value={form.salary}
          onChange={(e) => set('salary', e.target.value)}
          required
        />
        <p className="el-hint">Current: {formatSalary(emp.salary)}</p>
      </div>
      <div>
        <FieldLabel>New Manager</FieldLabel>
        <FormSelect
          value={form.managerId}
          onChange={(e) => set('managerId', e.target.value)}
        >
          <option value="">— None —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </FormSelect>
        {emp.managerName && (
          <p className="el-hint">Current: {emp.managerName}</p>
        )}
      </div>
      <SaveBtn loading={loading} label="Confirm Promotion" color="amber" />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: STATUS
═══════════════════════════════════════════════════════════════ */
function StatusTab({ emp, onSaved, viewerRank }) {
  if (!canManage(viewerRank, emp.roles))
    return (
      <PermissionBanner message="You cannot change this employee's status." />
    );

  const [status, setStatus] = useState(emp.employeeStatus);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const isDanger = status === 'SUSPENDED' || status === 'TERMINATED';
  const isSuspended = emp.employeeStatus === 'SUSPENDED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      await axiosInstance.patch(`/employees/${emp.id}/status`, { status });
      setToast({ msg: `Status updated to ${status}`, type: 'success' });
      onSaved();
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message ?? 'Status update failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="el-form-space">
      <ElToast msg={toast?.msg} type={toast?.type} />
      <div
        className={`el-info-banner ${isSuspended ? 'el-info-banner--green' : 'el-info-banner--red'}`}
      >
        {isSuspended ? (
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        ) : (
          <ShieldOff size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        )}
        {isSuspended
          ? `${emp.firstName} is currently suspended. Select a new status to restore access.`
          : `Changing status will affect ${emp.firstName}'s access. Choose carefully.`}
      </div>
      <div>
        <FieldLabel>Set Status</FieldLabel>
        <div className="el-status-grid">
          {STATUSES.map((s) => {
            const st = STATUS_STYLE[s] ?? {
              bg: '#f3f4f6',
              color: '#374151',
              shadow: '#d1d5db',
            };
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`el-status-btn ${active ? '' : 'el-status-btn--off'}`}
                style={
                  active
                    ? {
                        background: st.bg,
                        color: st.color,
                        boxShadow: `0 0 0 1px ${st.shadow}`,
                      }
                    : {}
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <SaveBtn
        loading={loading}
        label={status === 'SUSPENDED' ? 'Suspend Employee' : `Set to ${status}`}
        color={isDanger ? 'red' : 'green'}
      />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: ATTENDANCE
═══════════════════════════════════════════════════════════════ */
const ATT_STYLE = {
  PRESENT: { bg: '#d1fae5', color: '#065f46' },
  LATE: { bg: '#fef3c7', color: '#92400e' },
  ABSENT: { bg: '#fee2e2', color: '#7f1d1d' },
  HALF_DAY: { bg: '#dbeafe', color: '#1e3a8a' },
};

function AttendanceTab({ emp, viewerRank }) {
  if (viewerRank < 2)
    return (
      <PermissionBanner message="You cannot view this employee's attendance log." />
    );

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/attendance/employee/${emp.id}`)
      .then((res) => setRecords(res.data))
      .catch(() => setError('Failed to load attendance records.'))
      .finally(() => setLoading(false));
  }, [emp.id]);

  const fmt = (dt) =>
    !dt
      ? '—'
      : new Date(dt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '36px 0',
          color: 'var(--text-3)',
          fontSize: 13,
        }}
      >
        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />{' '}
        Loading attendance…
      </div>
    );
  if (error)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          color: '#dc2626',
          fontSize: 13,
          padding: '16px 0',
        }}
      >
        <AlertTriangle size={14} /> {error}
      </div>
    );
  if (records.length === 0)
    return (
      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-3)',
          fontSize: 13,
          padding: '36px 0',
          fontStyle: 'italic',
        }}
      >
        No attendance records found.
      </p>
    );

  return (
    <div style={{ overflowX: 'auto', margin: '0 -2px' }}>
      <table className="el-att-table">
        <thead>
          <tr>
            {['Date', 'In', 'Out', 'Mins', 'Status'].map((h) => (
              <th key={h} className="el-att-th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const st = ATT_STYLE[r.dailyStatus];
            return (
              <tr key={r.id} className="el-att-tr">
                <td
                  className="el-att-td"
                  style={{ fontWeight: 600, color: 'var(--text-1)' }}
                >
                  {r.date}
                </td>
                <td className="el-att-td">{fmt(r.clockIn)}</td>
                <td className="el-att-td">{fmt(r.clockOut)}</td>
                <td className="el-att-td">
                  {r.totalWorkMinutes ?? '—'}
                  {r.isManuallyAdjusted && (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: 9,
                        color: '#d97706',
                        fontWeight: 700,
                      }}
                      title="Manually adjusted"
                    >
                      ✎
                    </span>
                  )}
                </td>
                <td className="el-att-td">
                  {st ? (
                    <span
                      className="el-att-badge"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {r.dailyStatus}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE MODAL
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'view', label: 'Details', Icon: User },
  { key: 'edit', label: 'Edit', Icon: Pencil },
  { key: 'promote', label: 'Promote', Icon: TrendingUp },
  { key: 'status', label: 'Status', Icon: ShieldOff },
  { key: 'attendance', label: 'Attendance', Icon: ClipboardList },
];

function EmployeeModal({ emp: initialEmp, onClose, onUpdated, viewerRank }) {
  const [emp, setEmp] = useState(initialEmp);
  const [tab, setTab] = useState('view');
  const [refreshing, setRefreshing] = useState(false);
  const [colors] = useState(() => getGradient(initialEmp.id));
  const canEdit = canManage(viewerRank, emp.roles);

  const handleSaved = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axiosInstance.get(`/employees/${emp.id}`);
      setEmp(res.data);
      onUpdated(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, [emp.id, onUpdated]);

  const handleBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="el-overlay el-root" onClick={handleBackdrop}>
      <div className="el-modal" onClick={(e) => e.stopPropagation()}>
        {/* Hero banner */}
        <div
          className="el-modal-hero"
          style={{
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          }}
        >
          {/* subtle dot pattern */}
          <svg
            className="el-modal-hero-pattern"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="mdp"
                x="0"
                y="0"
                width="18"
                height="18"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mdp)" />
          </svg>
          <button className="el-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 14,
              display: 'flex',
              gap: 7,
              alignItems: 'center',
            }}
          >
            <StatusPill status={emp.employeeStatus} />
            {!canEdit && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,.2)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Lock size={9} /> Read-only
              </span>
            )}
          </div>
          <div className="el-modal-avatar-wrap">
            <ModalAvatar emp={emp} />
          </div>
        </div>

        {/* Identity */}
        <div className="el-modal-identity">
          <h2 className="el-modal-name">
            {emp.firstName} {emp.lastName}
          </h2>
          <p className="el-modal-jobtitle">
            {emp.jobTitle ?? 'No title assigned'}
          </p>
          <div className="el-modal-roles">
            {emp.roles?.map((r) => (
              <RolePill key={r.id} roleName={r.roleName} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="el-tabs">
          {TABS.map(({ key, label, Icon }) => {
            const isAction = key !== 'view';
            const dim = isAction && !canEdit;
            return (
              <button
                key={key}
                onClick={() => !dim && setTab(key)}
                className={`el-tab ${tab === key ? 'el-tab--active' : ''} ${dim ? 'el-tab--dim' : ''}`}
              >
                <Icon size={12} />
                {label}
                {dim && (
                  <Lock size={9} style={{ marginLeft: 2, opacity: 0.6 }} />
                )}
              </button>
            );
          })}
          {refreshing && (
            <div className="el-tab-refreshing">
              <Loader2
                size={10}
                style={{ animation: 'spin 1s linear infinite' }}
              />{' '}
              Refreshing…
            </div>
          )}
        </div>

        {/* Tab body */}
        <div className="el-tab-body">
          {tab === 'view' && <ViewTab emp={emp} />}
          {tab === 'edit' && (
            <EditTab emp={emp} onSaved={handleSaved} viewerRank={viewerRank} />
          )}
          {tab === 'promote' && (
            <PromoteTab
              emp={emp}
              onSaved={handleSaved}
              viewerRank={viewerRank}
            />
          )}
          {tab === 'status' && (
            <StatusTab
              emp={emp}
              onSaved={handleSaved}
              viewerRank={viewerRank}
            />
          )}
          {tab === 'attendance' && (
            <AttendanceTab emp={emp} viewerRank={viewerRank} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH + FILTER BAR
═══════════════════════════════════════════════════════════════ */
function SearchFilterBar({
  search,
  setSearch,
  department,
  setDepartment,
  jobTitle,
  setJobTitle,
  departments,
  jobTitles,
}) {
  const hasFilter = department || jobTitle;
  const activeCount = [department, jobTitle].filter(Boolean).length;

  return (
    <div className="el-filter-bar">
      <div className="el-search-wrap">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="el-input el-search-input"
        />
        {search && (
          <button className="el-search-clear" onClick={() => setSearch('')}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="el-select-wrap">
        <Building2 size={13} />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="el-select"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="el-select-wrap">
        <User size={13} />
        <select
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="el-select"
        >
          <option value="">All Job Titles</option>
          {jobTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <button
          className="el-clear-btn"
          onClick={() => {
            setDepartment('');
            setJobTitle('');
          }}
        >
          <X size={11} /> Clear ({activeCount})
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE LIST PAGE
═══════════════════════════════════════════════════════════════ */
const EmployeeList = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const rawRole = getHighestRole(user?.roles ?? []);
  const viewerRank = ROLE_HIERARCHY[rawRole] ?? 1;

  useEffect(() => {
    axiosInstance
      .get('/employees')
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error('Failed to load employees', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = useCallback((updated) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelected(updated);
  }, []);

  const departments = useMemo(
    () =>
      [
        ...new Set(employees.map((e) => e.departmentName).filter(Boolean)),
      ].sort(),
    [employees]
  );
  const jobTitles = useMemo(
    () => [...new Set(employees.map((e) => e.jobTitle).filter(Boolean))].sort(),
    [employees]
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.departmentName?.toLowerCase().includes(q) ||
        emp.jobTitle?.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!department || emp.departmentName === department) &&
        (!jobTitle || emp.jobTitle === jobTitle)
      );
    });
  }, [employees, search, department, jobTitle]);

  if (loading) {
    return (
      <div className="el-root el-page">
        <div className="el-page-header">
          <div className="el-page-header-left">
            <div className="el-icon-box">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <div
                className="el-skeleton"
                style={{ height: 20, width: 220, marginBottom: 6 }}
              />
              <div className="el-skeleton" style={{ height: 13, width: 160 }} />
            </div>
          </div>
        </div>
        <div className="el-filter-bar">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="el-skeleton"
              style={{
                height: 38,
                flex: i === 1 ? 1 : 'none',
                width: i === 1 ? undefined : 188,
              }}
            />
          ))}
        </div>
        <div className="el-table-card">
          <div
            style={{
              height: 44,
              borderBottom: '1px solid var(--border)',
              background: 'var(--paper)',
            }}
          />
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div
                className="el-skeleton"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="el-skeleton"
                  style={{ height: 13, width: 180, marginBottom: 6 }}
                />
                <div
                  className="el-skeleton"
                  style={{ height: 11, width: 130 }}
                />
              </div>
              <div
                className="el-skeleton"
                style={{ height: 22, width: 80, borderRadius: 20 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="el-root">
      <style>{GLOBAL_STYLES}</style>

      <div className="el-page">
        {/* Page header */}
        <div className="el-page-header">
          <div className="el-page-header-left">
            <div className="el-icon-box">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <h1 className="el-page-title">Employee Directory</h1>
              <p className="el-page-subtitle">
                {employees.length} employees across all departments
              </p>
            </div>
          </div>
          <RolePill roleName={rawRole ?? 'EMPLOYEE'} />
        </div>

        {/* Search / filter */}
        <SearchFilterBar
          search={search}
          setSearch={setSearch}
          department={department}
          setDepartment={setDepartment}
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          departments={departments}
          jobTitles={jobTitles}
        />

        <p className="el-result-count">
          {filtered.length === employees.length
            ? `${employees.length} employees`
            : `${filtered.length} of ${employees.length} employees`}
        </p>

        {/* Table */}
        <div className="el-table-card">
          <table className="el-table">
            <thead className="el-thead">
              <tr>
                {[
                  'Employee',
                  'Email',
                  'Department',
                  'Job Title',
                  'Status',
                  '',
                ].map((h, i) => (
                  <th key={i} className="el-th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="el-empty">
                    No employees match your search or filters.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => {
                const manageable = canManage(viewerRank, emp.roles);
                return (
                  <tr
                    key={emp.id}
                    className="el-tr"
                    onClick={() => setSelected(emp)}
                  >
                    <td className="el-td">
                      <div className="el-name-cell">
                        <Avatar emp={emp} size={32} />
                        <span className="el-td-name">
                          {emp.firstName} {emp.lastName}
                        </span>
                        {!manageable && (
                          <Lock
                            size={10}
                            color="var(--border-md)"
                            title="You cannot manage this employee"
                          />
                        )}
                      </div>
                    </td>
                    <td className="el-td">{emp.email}</td>
                    <td className="el-td">{emp.departmentName || '—'}</td>
                    <td className="el-td">{emp.jobTitle || '—'}</td>
                    <td className="el-td">
                      <StatusPill status={emp.employeeStatus} />
                    </td>
                    <td className="el-td" style={{ textAlign: 'right' }}>
                      <ChevronRight
                        size={15}
                        className="el-chevron"
                        style={{ display: 'inline-block' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <EmployeeModal
          emp={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          viewerRank={viewerRank}
        />
      )}
    </div>
  );
};

export default EmployeeList;
