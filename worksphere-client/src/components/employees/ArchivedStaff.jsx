import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ROLE_HIERARCHY, getHighestRole, canManage } from '../../utils/rbac';
import { GLOBAL_STYLES } from './shared/constants';
import { Avatar, RolePill, StatusPill } from './shared/atoms';

/* ================= STYLES ================= */

const PAGE_STYLES = `
  .el-root {
    padding: 24px;
    background: #ffffff;
    min-height: 100%;
  }
  .el-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
  }
  .el-page-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #0f172a;
  }
  .el-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.9rem;
  }
  .el-table th {
    padding: 12px 16px;
    background-color: #f8fafc;
    color: #475569;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
  }
  .el-table td {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: middle;
  }
  .el-table tbody tr:hover {
    background-color: #f1f5f9;
  }
`;

/* ================= HELPERS ================= */

const formatDate = (val) =>
  val
    ? new Date(val).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const getDurationDays = (start, end) => {
  if (!start || !end) return null;
  return Math.max(
    0,
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
  );
};

const getTenureYears = (join, end) => {
  if (!join || !end) return null;
  return (
    (new Date(end) - new Date(join)) /
    (1000 * 60 * 60 * 24 * 365)
  ).toFixed(1);
};

const getSalaryBand = (salary) => {
  if (!salary) return '—';
  if (salary < 50000) return 'Low';
  if (salary < 100000) return 'Mid';
  return 'High';
};

const ClearanceDot = ({ ok, label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      color: ok ? '#16a34a' : '#dc2626',
    }}
  >
    {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
    {label}
  </span>
);

const ReasonPill = ({ reason }) => {
  const map = {
    TERMINATION: '#dc2626',
    RESIGNATION: '#2563eb',
  };
  return (
    <span
      style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 20,
        background: map[reason] || '#64748b',
        color: '#fff',
        fontWeight: 500,
      }}
    >
      {reason}
    </span>
  );
};

/* ================= EXPANDED PANEL ================= */

function OffboardingPanel({ emp, ob, colSpan }) {
  if (!ob) {
    return (
      <tr>
        <td
          colSpan={colSpan}
          style={{ padding: 16, textAlign: 'center', color: '#64748b' }}
        >
          No offboarding data available.
        </td>
      </tr>
    );
  }

  const duration = getDurationDays(ob.initiatedAt, ob.lastWorkingDay);
  const tenure = getTenureYears(emp.joiningDate, ob.lastWorkingDay);

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: 24,
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 40,
            flexWrap: 'wrap',
            lineHeight: '1.6',
          }}
        >
          <div>
            <b style={{ color: '#475569' }}>Reason:</b> {ob.reason}
          </div>
          <div>
            <b style={{ color: '#475569' }}>Status:</b> {ob.status}
          </div>
          <div>
            <b style={{ color: '#475569' }}>Initiated:</b>{' '}
            {formatDate(ob.initiatedAt)}
          </div>
          <div>
            <b style={{ color: '#475569' }}>Last Day:</b>{' '}
            {formatDate(ob.lastWorkingDay)}
          </div>
          <div>
            <b style={{ color: '#475569' }}>Duration:</b> {duration ?? '—'} days
          </div>
          <div>
            <b style={{ color: '#475569' }}>Tenure:</b> {tenure ?? '—'} yrs
          </div>
          <div>
            <b style={{ color: '#475569' }}>Manager:</b>{' '}
            {emp.managerName || '—'}
          </div>
          <div>
            <b style={{ color: '#475569' }}>Salary Band:</b>{' '}
            {getSalaryBand(emp.salary)}
          </div>
          <div>
            <b
              style={{
                color: '#475569',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Clearances:
            </b>
            <div style={{ display: 'flex', gap: 12 }}>
              <ClearanceDot ok={ob.itClearance} label="IT" />
              <ClearanceDot ok={ob.hrClearance} label="HR" />
              <ClearanceDot ok={ob.financeClearance} label="Finance" />
            </div>
          </div>

          {ob.remarks && (
            <div style={{ width: '100%', marginTop: '8px' }}>
              <b style={{ color: '#475569' }}>Remarks:</b>
              <p
                style={{
                  fontStyle: 'italic',
                  color: '#64748b',
                  margin: '4px 0 0 0',
                }}
              >
                "{ob.remarks}"
              </p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ================= MAIN ================= */

export default function ArchivedStaff() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const rawRole = getHighestRole(user?.roles ?? []);
  const viewerRank = ROLE_HIERARCHY[rawRole] ?? 0;

  useEffect(() => {
    axiosInstance.get('/employees/archived').then((res) => {
      setRecords(res.data);
    });
  }, []);

  /* ===== SUMMARY ===== */
  const stats = useMemo(() => {
    const total = records.length;
    const terminated = records.filter(
      (r) => r.offboardingRecord?.reason === 'TERMINATION'
    ).length;
    const resigned = records.filter(
      (r) => r.offboardingRecord?.reason === 'RESIGNATION'
    ).length;
    const pending = records.filter(
      (r) =>
        !(
          r.offboardingRecord?.itClearance &&
          r.offboardingRecord?.hrClearance &&
          r.offboardingRecord?.financeClearance
        )
    ).length;

    return { total, terminated, resigned, pending };
  }, [records]);

  return (
    <div className="el-root">
      <style>{GLOBAL_STYLES}</style>
      <style>{PAGE_STYLES}</style>

      {/* HEADER */}
      <div className="el-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} color="#2563eb" />
          <h1>Archived Staff</h1>
        </div>
        <RolePill roleName={rawRole} />
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          marginBottom: 24,
          padding: '16px 24px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          color: '#334155',
          fontSize: '0.95rem',
        }}
      >
        <div>
          <strong style={{ color: '#0f172a' }}>Total:</strong> {stats.total}
        </div>
        <div>
          <strong style={{ color: '#0f172a' }}>Terminated:</strong>{' '}
          {stats.terminated}
        </div>
        <div>
          <strong style={{ color: '#0f172a' }}>Resigned:</strong>{' '}
          {stats.resigned}
        </div>
        <div>
          <strong style={{ color: '#0f172a' }}>Pending Clearance:</strong>{' '}
          {stats.pending}
        </div>
      </div>

      {/* TABLE */}
      <table className="el-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Job</th>
            <th>Reason</th>
            <th>Duration</th>
            <th>Clearance</th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#64748b',
                }}
              >
                No archived staff records found.
              </td>
            </tr>
          ) : (
            records.map(({ employee: emp, offboardingRecord: ob }) => {
              const isExpanded = expandedId === emp.id;

              const duration = getDurationDays(
                ob?.initiatedAt,
                ob?.lastWorkingDay
              );

              const cleared =
                ob?.itClearance && ob?.hrClearance && ob?.financeClearance;

              const manageable = canManage(viewerRank, emp.roles);

              return (
                <React.Fragment key={emp.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: `4px solid ${cleared ? '#16a34a' : '#f59e0b'}`,
                    }}
                  >
                    <td
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <Avatar emp={emp} size={32} />
                      <span style={{ fontWeight: 500 }}>
                        {emp.firstName} {emp.lastName}
                      </span>
                      {!manageable && (
                        <Lock
                          size={12}
                          color="#94a3b8"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </td>

                    <td title={`Manager: ${emp.managerName}`}>
                      {emp.departmentName}
                    </td>

                    <td>{emp.jobTitle}</td>

                    <td>
                      <ReasonPill reason={ob?.reason} />
                    </td>

                    <td>{duration ? `${duration}d` : '—'}</td>

                    <td>
                      <StatusPill status={cleared ? 'Cleared' : 'Pending'} />
                    </td>

                    <td style={{ color: '#64748b' }}>
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <OffboardingPanel emp={emp} ob={ob} colSpan={7} />
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
