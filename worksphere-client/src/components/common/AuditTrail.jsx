/**
 * AuditTrail — A compact, read-only block displaying audit metadata.
 * ONLY visible to HR, Admin (SUPER_ADMIN), and Auditor users.
 *
 * Usage:
 *   <AuditTrail user={user} record={employee} />
 *
 * `user`   — the context user from AuthContext (has isHR, isGlobalAdmin, isAuditor flags)
 * `record` — any API response object that may contain:
 *              createdAt, createdBy, updatedAt, updatedBy
 */
import { Clock, UserCheck, Edit2 } from 'lucide-react';

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTrail({ user, record }) {
  // Only HR, Admin, or Auditor may see audit metadata
  if (!user) return null;
  if (!user.isHR && !user.isGlobalAdmin && !user.isAuditor) return null;
  if (!record) return null;

  const rows = [
    {
      Icon: Clock,
      label: 'Created',
      value: record.createdAt
        ? `${fmtDate(record.createdAt)}${record.createdBy ? ` by ${record.createdBy}` : ''}`
        : '—',
    },
    {
      Icon: Edit2,
      label: 'Last Updated',
      value: record.updatedAt
        ? `${fmtDate(record.updatedAt)}${record.updatedBy ? ` by ${record.updatedBy}` : ''}`
        : '—',
    },
  ];

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid var(--border, #e5e7eb)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 8,
          color: 'var(--text-3, #9ca3af)',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <UserCheck size={11} />
        Audit Info
      </div>
      {rows.map(({ Icon, label, value }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '5px 0',
            borderBottom: '1px solid var(--border, #f3f4f6)',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--surface-2, #f9fafb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--text-3, #9ca3af)',
            }}
          >
            <Icon size={11} />
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-3, #9ca3af)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-2, #6b7280)',
                marginTop: 1,
                fontStyle: value === '—' ? 'italic' : 'normal',
              }}
            >
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
