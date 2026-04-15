import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Mail, Building2, User, DollarSign, Clock, Calendar, TrendingUp, ShieldOff, ShieldCheck, X, Lock, Loader2, AlertTriangle } from 'lucide-react';
import HRActionModal from '../../features/hr/HRActionModal';

import { formatSalary, formatDate, getGradient } from './utils/helpers';
import { canManage, assignableRoles } from '../../utils/rbac';
import { STATUSES, STATUS_STYLE, ROLE_STYLE, TABS, ATT_STYLE, GLOBAL_STYLES } from './shared/constants';
import { PermissionBanner, ElToast, FieldLabel, FormInput, FormSelect, SaveBtn, StatusPill, RolePill, ModalAvatar } from './shared/atoms';

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
            {React.createElement(Icon, { size: 13 })}
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
  const isAllowed = canManage(viewerRank, emp.roles);

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
    if (!isAllowed) return;
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
  }, [emp.id, viewerRank, isAllowed]);

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

  if (!isAllowed)
    return <PermissionBanner message="You cannot edit this employee's profile." />;

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
              const cleanName = r.roleName
                ? r.roleName.replace(/^ROLE_/, '')
                : '';
              // We could import ROLE_STYLE, but wait, we need it. Let's import it from constants.
              // Wait, ROLE_STYLE is imported but not used directly. Ah, we used it in RolePill.
              const s = ROLE_STYLE?.[cleanName] ?? {
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
                  {cleanName}
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
  const isAllowed = canManage(viewerRank, emp.roles);

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
    if (!isAllowed) return;
    Promise.all([
      axiosInstance.get('/jobPositions'),
      axiosInstance.get('/employees'),
    ])
      .then(([p, e]) => {
        setPositions(p.data);
        setManagers(e.data.filter((x) => x.id !== emp.id));
      })
      .catch(() => setToast({ msg: 'Failed to load data', type: 'error' }));
  }, [emp.id, isAllowed]);

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
function StatusTab({ emp, onUpdated, viewerRank }) {
  const isAllowed = canManage(viewerRank, emp.roles);

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
      const response = await axiosInstance.patch(`/employees/${emp.id}/status`, { status });
      // Endpoint now returns the updated employee — update state directly without a second GET
      onUpdated(response.data);
      setToast({ msg: `Status updated to ${status}`, type: 'success' });
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message ?? 'Status update failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAllowed)
    return (
      <PermissionBanner message="You cannot change this employee's status." />
    );

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
function AttendanceTab({ emp, viewerRank }) {
  const isAllowed = viewerRank >= 2;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAllowed) return;
    // eslint-disable-next-line
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/attendance/employee/${emp.id}`)
      .then((res) => setRecords(res.data))
      .catch(() => setError('Failed to load attendance records.'))
      .finally(() => setLoading(false));
  }, [emp.id, isAllowed]);

  const fmt = (dt) =>
    !dt
      ? '—'
      : new Date(dt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

  if (!isAllowed)
    return (
      <PermissionBanner message="You cannot view this employee's attendance log." />
    );

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
function EmployeeModal({ emp: initialEmp, onClose, onUpdated, viewerRank }) {
  const [emp, setEmp] = useState(initialEmp);
  const [tab, setTab] = useState('view');
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
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
      <style>{GLOBAL_STYLES}</style>
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
            <div className="el-modal-roles flex items-center gap-2 mt-2 flex-wrap">
              {emp.roles?.map((r) => (
                <RolePill key={r.id} roleName={r.roleName} />
              ))}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowActionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-full text-[11px] font-semibold transition"
                >
                  <AlertTriangle size={12} />
                  Formal Action
                </button>
              )}
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
                {React.createElement(Icon, { size: 12 })}
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
              onUpdated={onUpdated}
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

export default EmployeeModal;
