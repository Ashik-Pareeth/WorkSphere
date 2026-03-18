import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
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
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  axiosInstance.defaults.baseURL?.replace(/\/+$/, '') ||
  '';

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

function Select({ children, className = '', ...props }) {
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
        value={emp.workScheduleName}
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
function EditTab({ emp, onSaved }) {
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
    workScheduleId: emp.workScheduleId ?? '',
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
      axiosInstance.get('/job-positions'),
      axiosInstance.get('/work-schedules'),
      axiosInstance.get('/employees'),
      axiosInstance.get('/roles'),
    ])
      .then(([d, p, s, e, r]) => {
        setDepts(d.data);
        setPositions(p.data);
        setSchedules(s.data);
        setManagers(e.data.filter((x) => x.id !== emp.id));
        setAllRoles(r.data);
      })
      .catch(() =>
        setToast({ msg: 'Failed to load form data', type: 'error' })
      );
  }, [emp.id]);

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
        <Select value={form.Id} onChange={(e) => set('Id', e.target.value)}>
          <option value="">— None —</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Job Position</FieldLabel>
        <Select
          value={form.jobPositionId}
          onChange={(e) => set('jobPositionId', e.target.value)}
        >
          <option value="">— None —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.positionName}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Manager</FieldLabel>
        <Select
          value={form.managerId}
          onChange={(e) => set('managerId', e.target.value)}
        >
          <option value="">— None —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Work Schedule</FieldLabel>
        <Select
          value={form.workScheduleId}
          onChange={(e) => set('workScheduleId', e.target.value)}
        >
          <option value="">— None —</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.scheduleName}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Roles</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {allRoles.map((r) => {
            const active = form.roles.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 transition ${
                  active
                    ? (ROLE_COLOR[r.roleName] ??
                      'bg-blue-100 text-blue-700 ring-blue-200')
                    : 'bg-gray-100 text-gray-400 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                {r.roleName}
              </button>
            );
          })}
        </div>
      </div>

      <SaveBtn loading={loading} color="blue" />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PROMOTE
═══════════════════════════════════════════════════════════════ */
function PromoteTab({ emp, onSaved }) {
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
      axiosInstance.get('/job-positions'),
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
        workScheduleId: emp.workScheduleId ?? null,
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
        <Select
          value={form.jobPositionId}
          onChange={(e) => set('jobPositionId', e.target.value)}
        >
          <option value="">— Keep current —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.positionName}
            </option>
          ))}
        </Select>
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
        <Select
          value={form.managerId}
          onChange={(e) => set('managerId', e.target.value)}
        >
          <option value="">— None —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </Select>
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
function StatusTab({ emp, onSaved }) {
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
        className={`rounded-xl p-3 text-xs font-medium flex gap-2 border ${
          emp.employeeStatus === 'SUSPENDED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
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
              className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 text-left transition ${
                status === s
                  ? (STATUS_STYLE[s] ??
                    'bg-gray-100 text-gray-600 ring-gray-200')
                  : 'bg-white text-gray-400 ring-gray-200 hover:ring-gray-300'
              }`}
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
   MAIN MODAL
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'view', label: 'Details', Icon: User },
  { key: 'edit', label: 'Edit', Icon: Pencil },
  { key: 'promote', label: 'Promote', Icon: TrendingUp },
  { key: 'status', label: 'Status', Icon: ShieldOff },
];

function EmployeeModal({ emp: initialEmp, onClose, onUpdated }) {
  const [emp, setEmp] = useState(initialEmp);
  const [tab, setTab] = useState('view');
  const [refreshing, setRefreshing] = useState(false);

  const gradient = getGradient(emp.id);
  const profileSrc = emp.profilePic
    ? `${API_BASE}/uploads/profilePhoto/${emp.profilePic}`
    : null;

  const handleSaved = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axiosInstance.get(`/employees/${emp.id}`);
      setEmp(res.data);
      onUpdated(res.data);
    } catch (_) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl my-4"
        style={{
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:scale(0.93) translateY(10px); }
            to   { opacity:1; transform:scale(1)    translateY(0); }
          }
        `}</style>

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
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px ${
                tab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          {refreshing && (
            <div className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 pr-1">
              <Loader2 size={11} className="animate-spin" /> Refreshing…
            </div>
          )}
        </div>

        {/* Tab body */}
        <div className="px-6 py-5">
          {tab === 'view' && <ViewTab emp={emp} />}
          {tab === 'edit' && <EditTab emp={emp} onSaved={handleSaved} />}
          {tab === 'promote' && <PromoteTab emp={emp} onSaved={handleSaved} />}
          {tab === 'status' && <StatusTab emp={emp} onSaved={handleSaved} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE LIST PAGE
═══════════════════════════════════════════════════════════════ */
const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading directory…</div>
    );

  return (
    <>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Directory
          </h1>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employee</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold">Job Title</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 sr-only">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
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
                          <span>
                            {emp.firstName} {emp.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {emp.departmentName || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
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
                  ))}
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
        />
      )}
    </>
  );
};

export default EmployeeList;
