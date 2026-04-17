import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  X,
  Building2,
  User,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ROLE_HIERARCHY, getHighestRole, canManage } from '../../utils/rbac';
import { GLOBAL_STYLES } from './shared/constants';
import { Avatar, RolePill, StatusPill } from './shared/atoms';

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
        padding: '3px 8px',
        borderRadius: 20,
        background: map[reason] || '#64748b',
        color: '#fff',
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
        <td colSpan={colSpan} style={{ padding: 16 }}>
          No offboarding data.
        </td>
      </tr>
    );
  }

  const duration = getDurationDays(ob.initiatedAt, ob.lastWorkingDay);
  const tenure = getTenureYears(emp.joiningDate, ob.lastWorkingDay);

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 20, background: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <b>Reason:</b> {ob.reason}
          </div>
          <div>
            <b>Status:</b> {ob.status}
          </div>
          <div>
            <b>Initiated:</b> {formatDate(ob.initiatedAt)}
          </div>
          <div>
            <b>Last Day:</b> {formatDate(ob.lastWorkingDay)}
          </div>
          <div>
            <b>Duration:</b> {duration ?? '—'} days
          </div>
          <div>
            <b>Tenure:</b> {tenure ?? '—'} yrs
          </div>
          <div>
            <b>Manager:</b> {emp.managerName || '—'}
          </div>
          <div>
            <b>Salary Band:</b> {getSalaryBand(emp.salary)}
          </div>
          <div>
            <b>Clearances:</b>
            <div style={{ display: 'flex', gap: 10 }}>
              <ClearanceDot ok={ob.itClearance} label="IT" />
              <ClearanceDot ok={ob.hrClearance} label="HR" />
              <ClearanceDot ok={ob.financeClearance} label="Finance" />
            </div>
          </div>

          {ob.remarks && (
            <div style={{ maxWidth: 400 }}>
              <b>Remarks:</b>
              <p style={{ fontStyle: 'italic', color: '#64748b' }}>
                {ob.remarks}
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

      {/* HEADER */}
      <div className="el-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users />
          <h1>Archived Staff</h1>
        </div>
        <RolePill roleName={rawRole} />
      </div>

      {/* SUMMARY STRIP */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div>Total: {stats.total}</div>
        <div>Terminated: {stats.terminated}</div>
        <div>Resigned: {stats.resigned}</div>
        <div>Pending Clearance: {stats.pending}</div>
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
            <th></th>
          </tr>
        </thead>

        <tbody>
          {records.map(({ employee: emp, offboardingRecord: ob }) => {
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
                  <td>
                    <Avatar emp={emp} size={32} /> {emp.firstName}{' '}
                    {emp.lastName}
                    {!manageable && <Lock size={10} />}
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

                  <td>{isExpanded ? <ChevronUp /> : <ChevronDown />}</td>
                </tr>

                {isExpanded && (
                  <OffboardingPanel emp={emp} ob={ob} colSpan={7} />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
