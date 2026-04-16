import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Lock, Loader2, Save } from 'lucide-react';
import { STATUS_STYLE, ROLE_STYLE } from './constants';
import { getGradient, getInitials } from '../utils/helpers';
import { resolveProfilePicSrc } from '../../../utils/profilePhoto';

export function StatusPill({ status }) {
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

export function RolePill({ roleName }) {
  const cleanName = roleName ? roleName.replace(/^ROLE_/, '') : '';
  const s = ROLE_STYLE[cleanName] ?? { bg: '#f3f4f6', color: '#374151' };

  return (
    <span
      className="el-pill"
      style={{
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 0 1px ${s.color}33`,
      }}
    >
      {cleanName.replace('_', ' ')}
    </span>
  );
}

function AvatarImage({ src, alt, className, style, fallback }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

export function Avatar({ emp, size = 32 }) {
  const [colors] = useState(() => getGradient(emp.id));
  const profileSrc = resolveProfilePicSrc(emp.profilePic);
  const fallback = (
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

  return (
    <AvatarImage
      src={profileSrc}
      alt={emp.firstName}
      className="el-avatar"
      style={{ width: size, height: size }}
      fallback={fallback}
    />
  );
}

export function ModalAvatar({ emp }) {
  const [colors] = useState(() => getGradient(emp.id));
  const profileSrc = resolveProfilePicSrc(emp.profilePic);
  const fallback = (
    <div
      className="el-modal-avatar-initials"
      style={{
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      {getInitials(emp.firstName, emp.lastName)}
    </div>
  );

  return (
    <AvatarImage
      src={profileSrc}
      alt={emp.firstName}
      className="el-modal-avatar"
      fallback={fallback}
    />
  );
}

export function ElToast({ msg, type }) {
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

export function PermissionBanner({ message }) {
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

export function FieldLabel({ children }) {
  return <label className="el-field-label">{children}</label>;
}

export function FormInput({ ...props }) {
  return <input className="el-form-input" {...props} />;
}

export function FormSelect({ children, ...props }) {
  return (
    <select className="el-form-select" {...props}>
      {children}
    </select>
  );
}

export function SaveBtn({ loading, label = 'Save Changes', color = 'blue' }) {
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
