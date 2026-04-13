import axiosInstance from '../../../api/axiosInstance';
import { User, Pencil, TrendingUp, ShieldOff, ClipboardList } from 'lucide-react';

export const GLOBAL_STYLES = `
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

export const STATUSES = [
  'ACTIVE',
  'PENDING',
  'PROBATION',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
  'INACTIVE',
];

export const STATUS_STYLE = {
  ACTIVE: { bg: '#d1fae5', color: '#065f46', shadow: '#6ee7b7' },
  PENDING: { bg: '#fef9c3', color: '#713f12', shadow: '#fde047' },
  PROBATION: { bg: '#dbeafe', color: '#1e3a8a', shadow: '#93c5fd' },
  SUSPENDED: { bg: '#fee2e2', color: '#7f1d1d', shadow: '#fca5a5' },
  TERMINATED: { bg: '#f3f4f6', color: '#374151', shadow: '#d1d5db' },
  RESIGNED: { bg: '#ffedd5', color: '#7c2d12', shadow: '#fdba74' },
  INACTIVE: { bg: '#f3f4f6', color: '#6b7280', shadow: '#d1d5db' },
};

export const ROLE_STYLE = {
  SUPER_ADMIN: { bg: '#fee2e2', color: '#991b1b' },
  HR: { bg: '#ede9fe', color: '#5b21b6' },
  MANAGER: { bg: '#fef3c7', color: '#92400e' },
  EMPLOYEE: { bg: '#e0f2fe', color: '#075985' },
  AUDITOR: { bg: '#ccfbf1', color: '#134e4a' },
};

export const AVATAR_PALETTES = [
  ['#3b5998', '#2d4373'],
  ['#059669', '#047857'],
  ['#dc2626', '#b91c1c'],
  ['#7c3aed', '#6d28d9'],
  ['#db2777', '#be185d'],
  ['#d97706', '#b45309'],
];

export const API_BASE = axiosInstance.defaults.baseURL?.replace(/\/+$/, '') ?? '';

export const ATT_STYLE = {
  PRESENT: { bg: '#d1fae5', color: '#065f46' },
  LATE: { bg: '#fef3c7', color: '#92400e' },
  ABSENT: { bg: '#fee2e2', color: '#7f1d1d' },
  HALF_DAY: { bg: '#dbeafe', color: '#1e3a8a' },
};

export const TABS = [
  { key: 'view', label: 'Details', Icon: User },
  { key: 'edit', label: 'Edit', Icon: Pencil },
  { key: 'promote', label: 'Promote', Icon: TrendingUp },
  { key: 'status', label: 'Status', Icon: ShieldOff },
  { key: 'attendance', label: 'Attendance', Icon: ClipboardList },
];
