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
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  PENDING: 'bg-yellow-100  text-yellow-700  ring-yellow-200',
  PROBATION: 'bg-blue-100    text-blue-700    ring-blue-200',
  SUSPENDED: 'bg-red-100     text-red-700     ring-red-200',
  TERMINATED: 'bg-gray-200    text-gray-600    ring-gray-300',
  RESIGNED: 'bg-orange-100  text-orange-700  ring-orange-200',
  INACTIVE: 'bg-gray-100    text-gray-500    ring-gray-200',
};

const ROLE_COLOR = {
  SUPER_ADMIN: 'bg-red-100    text-red-700    ring-red-200',
  HR: 'bg-violet-100 text-violet-700 ring-violet-200',
  MANAGER: 'bg-amber-100  text-amber-700  ring-amber-200',
  EMPLOYEE: 'bg-sky-100    text-sky-700    ring-sky-200',
  AUDITOR: 'bg-teal-100   text-teal-700   ring-teal-200',
};

const avatarGradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
];

function getGradient(id = '') {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return avatarGradients[n % avatarGradients.length];
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

// Single source of truth for API base — matches axiosInstance
const API_BASE = axiosInstance.defaults.baseURL?.replace(/\/+$/, '') ?? '';

/* ═══════════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════════ */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500 shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 truncate">
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      {children}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${className}`}
      {...props}
    />
  );
}

function FormSelect({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function SaveBtn({ loading, label = 'Save Changes', color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-emerald-600 hover:bg-emerald-700',
  };
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 ${colors[color]} text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60`}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Save size={15} />
      )}
      {loading ? 'Saving…' : label}
    </button>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const style =
    type === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium mb-3 ${style}`}
    >
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
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="p-3 rounded-full bg-gray-100">
        <Lock size={20} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-500">{message}</p>
      <p className="text-xs text-gray-400">
        You do not have sufficient permissions to perform this action.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: VIEW
═══════════════════════════════════════════════════════════════ */
function ViewTab({ emp }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">
      <DetailRow icon={Mail} label="Email" value={emp.email} />
      <DetailRow
        icon={Building2}
        label="Department"
        value={emp.departmentName}
      />
      <DetailRow icon={User} label="Reports To" value={emp.managerName} />
      <DetailRow
        icon={DollarSign}
        label="Salary"
        value={formatSalary(emp.salary)}
      />
      <DetailRow
        icon={Clock}
        label="Work Schedule"
        value={emp.workSchedule?.scheduleName}
      />
      <DetailRow
        icon={Calendar}
        label="Joined"
        value={formatDate(emp.joiningDate)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: EDIT
═══════════════════════════════════════════════════════════════ */
function EditTab({ emp, onSaved, viewerRank }) {
  const allowed = canManage(viewerRank, emp.roles);
  if (!allowed)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toast msg={toast?.msg} type={toast?.type} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>First Name</FieldLabel>
          <Input
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Last Name</FieldLabel>
          <Input
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Salary</FieldLabel>
          <Input
            type="number"
            value={form.salary}
            onChange={(e) => set('salary', e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>New Password</FieldLabel>
          <Input
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
          <span className="ml-2 text-[10px] normal-case font-normal text-gray-400">
            (only roles below your level)
          </span>
        </FieldLabel>
        {allRoles.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No assignable roles at your permission level.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allRoles.map((r) => {
              const active = form.roles.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 transition ${active ? (ROLE_COLOR[r.roleName] ?? 'bg-blue-100 text-blue-700 ring-blue-200') : 'bg-gray-100 text-gray-400 ring-gray-200 hover:ring-gray-300'}`}
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
  const allowed = canManage(viewerRank, emp.roles);
  if (!allowed)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toast msg={toast?.msg} type={toast?.type} />
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium flex gap-2">
        <TrendingUp size={14} className="shrink-0 mt-0.5" />
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
        {emp.jobTitle && (
          <p className="text-[11px] text-gray-400 mt-1">
            Current: {emp.jobTitle}
          </p>
        )}
      </div>
      <div>
        <FieldLabel>New Salary</FieldLabel>
        <Input
          type="number"
          value={form.salary}
          onChange={(e) => set('salary', e.target.value)}
          required
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Current: {formatSalary(emp.salary)}
        </p>
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
          <p className="text-[11px] text-gray-400 mt-1">
            Current: {emp.managerName}
          </p>
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
  const allowed = canManage(viewerRank, emp.roles);
  if (!allowed)
    return (
      <PermissionBanner message="You cannot change this employee's status." />
    );

  const [status, setStatus] = useState(emp.employeeStatus);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  const isDanger = status === 'SUSPENDED' || status === 'TERMINATED';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toast msg={toast?.msg} type={toast?.type} />
      <div
        className={`rounded-xl p-3 text-xs font-medium flex gap-2 border ${emp.employeeStatus === 'SUSPENDED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
      >
        {emp.employeeStatus === 'SUSPENDED' ? (
          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
        ) : (
          <ShieldOff size={14} className="shrink-0 mt-0.5" />
        )}
        {emp.employeeStatus === 'SUSPENDED'
          ? `${emp.firstName} is currently suspended. Select a new status to restore access.`
          : `Changing status will affect ${emp.firstName}'s access. Choose carefully.`}
      </div>
      <div>
        <FieldLabel>Set Status</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 text-left transition ${status === s ? (STATUS_STYLE[s] ?? 'bg-gray-100 text-gray-600 ring-gray-200') : 'bg-white text-gray-400 ring-gray-200 hover:ring-gray-300'}`}
            >
              {s}
            </button>
          ))}
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
   TAB: ATTENDANCE LOG
═══════════════════════════════════════════════════════════════ */
const DAILY_STATUS_STYLE = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  LATE: 'bg-amber-100 text-amber-700',
  ABSENT: 'bg-red-100 text-red-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
};

function AttendanceTab({ emp, viewerRank }) {
  const canView = viewerRank >= 2;
  if (!canView)
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
      <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading attendance…
      </div>
    );
  if (error)
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm py-4">
        <AlertTriangle size={14} /> {error}
      </div>
    );
  if (records.length === 0)
    return (
      <p className="text-center text-gray-400 text-sm py-8 italic">
        No attendance records found.
      </p>
    );

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-2 text-left font-semibold">Date</th>
            <th className="px-2 py-2 text-left font-semibold">In</th>
            <th className="px-2 py-2 text-left font-semibold">Out</th>
            <th className="px-2 py-2 text-left font-semibold">Mins</th>
            <th className="px-2 py-2 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-2 py-2 font-medium text-gray-700">{r.date}</td>
              <td className="px-2 py-2 text-gray-600">{fmt(r.clockIn)}</td>
              <td className="px-2 py-2 text-gray-600">{fmt(r.clockOut)}</td>
              <td className="px-2 py-2 text-gray-600">
                {r.totalWorkMinutes ?? '—'}
                {r.isManuallyAdjusted && (
                  <span
                    className="ml-1 text-[9px] text-orange-500 font-bold"
                    title="Manually adjusted"
                  >
                    ✎
                  </span>
                )}
              </td>
              <td className="px-2 py-2">
                {r.dailyStatus ? (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${DAILY_STATUS_STYLE[r.dailyStatus] ?? 'bg-gray-100 text-gray-500'}`}
                  >
                    {r.dailyStatus}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
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

  const gradient = getGradient(emp.id);
  const profileSrc = emp.profilePic
    ? `${API_BASE}/uploads/profilePhoto/${emp.profilePic}`
    : null;
  const canEdit = canManage(viewerRank, emp.roles);

  const handleSaved = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axiosInstance.get(`/employees/${emp.id}`);
      setEmp(res.data);
      onUpdated(res.data);
    } catch (err) {
      console.error('Error fetching updated employee data:', err);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl my-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div
          className={`relative rounded-t-2xl bg-gradient-to-br ${gradient}`}
          style={{ height: '7rem', marginBottom: '3.5rem' }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dp"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dp)" />
          </svg>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <X size={16} />
          </button>
          <span
            className={`absolute top-3 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ring-1 ${STATUS_STYLE[emp.employeeStatus] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}
          >
            {emp.employeeStatus}
          </span>
          {!canEdit && (
            <span className="absolute top-3 left-28 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white ring-1 ring-white/30">
              <Lock size={10} /> Read-only
            </span>
          )}
          {/* Avatar */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
            {profileSrc ? (
              <img
                src={profileSrc}
                alt={emp.firstName}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} border-4 border-white shadow-lg flex items-center justify-center`}
              >
                <span className="text-white text-2xl font-bold tracking-tight">
                  {getInitials(emp.firstName, emp.lastName)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name + roles */}
        <div className="text-center px-6 mb-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {emp.firstName} {emp.lastName}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {emp.jobTitle ?? 'No title assigned'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 px-6 mb-3">
          {emp.roles?.map((r) => (
            <span
              key={r.id}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${ROLE_COLOR[r.roleName] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}
            >
              {r.roleName.replace('_', ' ')}
            </span>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-4 gap-0.5">
          {TABS.map(({ key, label, Icon }) => {
            const isActionTab = key !== 'view';
            const dimmed = isActionTab && !canEdit;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px ${
                  tab === key
                    ? 'border-blue-500 text-blue-600'
                    : dimmed
                      ? 'border-transparent text-gray-300 cursor-default'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={13} />
                {label}
                {dimmed && <Lock size={10} className="ml-0.5 opacity-60" />}
              </button>
            );
          })}
          {refreshing && (
            <div className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 pr-1">
              <Loader2 size={11} className="animate-spin" /> Refreshing…
            </div>
          )}
        </div>

        {/* Tab body */}
        <div className="px-6 py-5">
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
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="relative w-full sm:w-48">
        <Building2
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm appearance-none"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="relative w-full sm:w-48">
        <User
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <select
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm appearance-none"
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
          onClick={() => {
            setDepartment('');
            setJobTitle('');
          }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition shadow-sm whitespace-nowrap"
        >
          <X size={12} /> Clear ({activeCount})
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

  // Derive viewer rank from AuthContext — single source of truth, no localStorage
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
      <div className="px-6 py-4 lg:px-8 lg:py-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48 hidden sm:block" />
          <Skeleton className="h-10 w-48 hidden sm:block" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b bg-gray-50 h-14 w-full" />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="border-b border-gray-100 p-4 flex gap-6 items-center"
            >
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
              <Skeleton className="h-6 w-20 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-4 lg:px-8 lg:py-6 max-w-7xl mx-auto space-y-5">
        {/* Page header — matches project pattern */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Employee Directory
              </h1>
              <p className="text-sm text-gray-500">
                {employees.length} employees across all departments
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${ROLE_COLOR[rawRole] ?? 'bg-gray-100 text-gray-500 ring-gray-200'}`}
          >
            {rawRole?.replace('_', ' ')}
          </span>
        </div>

        {/* Search + filter */}
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

        <p className="text-xs text-gray-400">
          {filtered.length === employees.length
            ? `${employees.length} employees`
            : `${filtered.length} of ${employees.length} employees`}
        </p>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Department
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Job Title
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3.5 sr-only">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-400 text-sm"
                      >
                        No employees match your search or filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((emp) => {
                    const manageable = canManage(viewerRank, emp.roles);
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                        onClick={() => setSelected(emp)}
                      >
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-3">
                            {emp.profilePic ? (
                              <img
                                src={`${API_BASE}/uploads/profilePhoto/${emp.profilePic}`}
                                alt={emp.firstName}
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getGradient(emp.id)} flex items-center justify-center shrink-0`}
                              >
                                <span className="text-white text-xs font-bold">
                                  {getInitials(emp.firstName, emp.lastName)}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-800">
                              {emp.firstName} {emp.lastName}
                            </span>
                            {!manageable && (
                              <Lock
                                size={11}
                                className="text-gray-300 ml-0.5 shrink-0"
                                title="You cannot manage this employee"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{emp.email}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {emp.departmentName || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {emp.jobTitle || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ring-1 ${STATUS_STYLE[emp.employeeStatus] ?? 'bg-gray-100 text-gray-500 ring-gray-200'}`}
                          >
                            {emp.employeeStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight
                            size={16}
                            className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selected && (
        <EmployeeModal
          emp={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          viewerRank={viewerRank}
        />
      )}
    </>
  );
};

export default EmployeeList;
