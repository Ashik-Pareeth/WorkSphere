/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { fetchMyAssets } from '@/api/hrApi';
import { getMyBalances } from '@/api/leaveApi';
import { getEmployeeActionHistory } from '../api/employeeActionApi';
import { resolveProfilePicSrc } from '../utils/profilePhoto';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Clock,
  CalendarRange,
  Laptop,
  Building,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle,
  Tag,
  Activity,
} from 'lucide-react';

// ─── Fetchers ─────────────────────────────────────────────────────────────────
const fetchProfile = async (userId) => {
  const { data } = await axiosInstance.get(`/employees/${userId}`);
  return data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
};

const conditionStyle = {
  EXCELLENT: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  GOOD: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  FAIR: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  POOR: { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'schedule', label: 'Schedule & Leave', icon: Clock },
  { id: 'assets', label: 'IT Assets', icon: Laptop },
  { id: 'financials', label: 'Financials', icon: CreditCard },
  { id: 'actions', label: 'Action History', icon: Activity },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div
    className="flex items-center justify-between py-3 border-b last:border-0"
    style={{ borderColor: '#f1f5f9' }}
  >
    <span
      className="flex items-center gap-2 text-sm"
      style={{ color: '#64748b' }}
    >
      {Icon && <Icon size={13} />}
      {label}
    </span>
    <span
      className="text-sm font-semibold"
      style={{ color: accent ? '#1d4ed8' : '#1e293b' }}
    >
      {value}
    </span>
  </div>
);

const Card = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl p-6 ${className}`}
    style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ icon: Icon, children }) => (
  <div
    className="flex items-center gap-2.5 mb-5 pb-4"
    style={{ borderBottom: '1px solid #f1f5f9' }}
  >
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center"
      style={{ background: '#eff6ff' }}
    >
      <Icon size={14} style={{ color: '#2563eb' }} />
    </div>
    <h3
      className="text-xs font-bold uppercase tracking-widest"
      style={{ color: '#475569' }}
    >
      {children}
    </h3>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth();
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [window.location.search]);

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user.id),
    enabled: !!user?.id,
  });

  const { data: assetsResponse = {} } = useQuery({
    queryKey: ['myAssets'],
    queryFn: fetchMyAssets,
  });
  const assets = assetsResponse?.data ?? [];

  const { data: leaves = [] } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: getMyBalances,
  });

  const { data: actionsResponse = {} } = useQuery({
    queryKey: ['myActions', user?.id],
    queryFn: () => getEmployeeActionHistory(user.id),
    enabled: !!user?.id,
  });
  const actionHistory = actionsResponse?.data ?? [];

  const profileSrc = resolveProfilePicSrc(profileData?.profilePic);

  useEffect(() => {
    setImageFailed(false);
  }, [profileSrc]);

  if (profileLoading) {
    return (
      <div
        className="flex h-[calc(100vh-64px)] items-center justify-center"
        style={{ background: '#f8fafc' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div
        className="flex h-[calc(100vh-64px)] items-center justify-center p-6"
        style={{ background: '#f8fafc' }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#be123c',
          }}
        >
          <AlertCircle size={16} />
          <span className="text-sm font-medium">
            Could not load profile. Please try again later.
          </span>
        </div>
      </div>
    );
  }

  const initials =
    `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`
      .trim()
      .toUpperCase() || 'U';

  const isActive = profileData.employeeStatus === 'ACTIVE';

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-64px)] overflow-y-auto"
      style={{ background: '#f8fafc', fontFamily: "'Lora', Georgia, serif" }}
    >
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #2563eb 100%)',
          paddingBottom: '64px',
        }}
      >
        <div className="max-w-5xl mx-auto px-8 pt-10 pb-2 flex items-end gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profileSrc && !imageFailed ? (
              <img
                src={profileSrc}
                alt={`${profileData.firstName} ${profileData.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.22)',
                }}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  letterSpacing: '0.05em',
                }}
              >
                {initials}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
              style={{
                background: isActive ? '#4ade80' : '#fbbf24',
                border: '2px solid #1d4ed8',
              }}
            />
          </div>

          {/* Name */}
          <div className="pb-1">
            <h1
              className="text-2xl font-bold capitalize"
              style={{ color: '#fff', letterSpacing: '-0.01em' }}
            >
              {profileData.firstName} {profileData.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span
                className="flex items-center gap-1.5 text-sm"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                <Briefcase size={13} />
                {profileData.jobTitle || 'Employee'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span
                className="flex items-center gap-1.5 text-sm"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                <Building size={13} />
                {profileData.departmentName || '—'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: isActive
                    ? 'rgba(74,222,128,0.2)'
                    : 'rgba(251,191,36,0.2)',
                  color: isActive ? '#4ade80' : '#fbbf24',
                  border: `1px solid ${isActive ? 'rgba(74,222,128,0.4)' : 'rgba(251,191,36,0.4)'}`,
                }}
              >
                {profileData.employeeStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS (overlap banner) ── */}
      <div
        className="max-w-5xl mx-auto w-full px-8"
        style={{ marginTop: '-48px' }}
      >
        {/* Tab card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex" style={{ borderBottom: '1px solid #f1f5f9' }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative flex items-center gap-2 px-5 py-4 text-sm transition-colors duration-150 outline-none flex-1 justify-center"
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1d4ed8' : '#94a3b8',
                    background: active ? '#eff6ff' : 'transparent',
                    borderBottom: active
                      ? '2px solid #2563eb'
                      : '2px solid transparent',
                  }}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="p-6">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardTitle icon={Mail}>Contact & Identity</CardTitle>
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={profileData.email}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={profileData.phoneNumber || 'Not provided'}
                  />
                  <InfoRow
                    icon={User}
                    label="Username"
                    value={`@${profileData.username}`}
                  />
                </Card>

                <Card>
                  <CardTitle icon={Building}>Organisation</CardTitle>
                  <InfoRow
                    label="Department"
                    value={profileData.departmentName || '—'}
                  />
                  <InfoRow
                    label="Job Title"
                    value={profileData.jobTitle || '—'}
                  />
                  <InfoRow
                    label="Reports To"
                    value={profileData.managerName || 'None (Top-level)'}
                    accent
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Joining Date"
                    value={fmt(profileData.joiningDate)}
                  />
                </Card>

                <Card className="md:col-span-2">
                  <CardTitle icon={Shield}>System Permissions</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {profileData.roles?.map((role) => (
                      <span
                        key={role.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest"
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {role.roleName.replace('ROLE_', '')}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* SCHEDULE & LEAVE */}
            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardTitle icon={Clock}>Work Schedule</CardTitle>
                  {profileData.workSchedule ? (
                    <>
                      <InfoRow
                        label="Shift Name"
                        value={profileData.workSchedule.scheduleName}
                      />
                      <InfoRow
                        label="Hours"
                        value={`${fmtTime(profileData.workSchedule.expectedStart)} – ${fmtTime(profileData.workSchedule.expectedEnd)}`}
                      />
                      <InfoRow
                        label="Grace Period"
                        value={`${profileData.workSchedule.gracePeriodMin} mins`}
                      />
                      <InfoRow
                        label="Break"
                        value={`${profileData.workSchedule.breakDurationMin} mins`}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Timezone"
                        value={profileData.workSchedule.timezone}
                      />
                    </>
                  ) : (
                    <p className="text-sm italic" style={{ color: '#94a3b8' }}>
                      No schedule assigned.
                    </p>
                  )}
                </Card>

                <Card>
                  <CardTitle icon={CalendarRange}>Leave Balances</CardTitle>
                  {Array.isArray(leaves) && leaves.length > 0 ? (
                    <div className="space-y-3">
                      {leaves.map((leave) => {
                        const pct =
                          leave.daysAllocated > 0
                            ? Math.round(
                                (leave.daysAvailable / leave.daysAllocated) *
                                  100
                              )
                            : 0;
                        return (
                          <div
                            key={leave.id}
                            className="p-4 rounded-xl"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: '#1e293b' }}
                                >
                                  {leave.leavePolicy?.name}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: '#94a3b8' }}
                                >
                                  Valid for {leave.validForYear}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className="text-2xl font-bold"
                                  style={{
                                    color: '#1d4ed8',
                                    fontFamily: "'Lora', Georgia, serif",
                                  }}
                                >
                                  {leave.daysAvailable}
                                </span>
                                <span
                                  className="text-xs ml-1"
                                  style={{ color: '#94a3b8' }}
                                >
                                  / {leave.daysAllocated} days
                                </span>
                              </div>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ background: '#e2e8f0' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                                }}
                              />
                            </div>
                            <div
                              className="flex justify-between mt-1.5 text-xs"
                              style={{ color: '#94a3b8' }}
                            >
                              <span>{leave.daysUsed} used</span>
                              <span>{pct}% remaining</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: '#94a3b8' }}>
                      No leave balances found.
                    </p>
                  )}
                </Card>
              </div>
            )}

            {/* ASSETS */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: '#eff6ff' }}
                    >
                      <Laptop size={14} style={{ color: '#2563eb' }} />
                    </div>
                    <h3
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: '#475569' }}
                    >
                      Assigned Assets
                    </h3>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-bold"
                    style={{ background: '#f1f5f9', color: '#64748b' }}
                  >
                    {assets.length} item{assets.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map((asset) => {
                      const cs = conditionStyle[asset.condition] ?? {
                        bg: '#f8fafc',
                        text: '#475569',
                        border: '#e2e8f0',
                      };
                      return (
                        <div
                          key={asset.id}
                          className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                          style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: '#eff6ff' }}
                          >
                            <Laptop size={20} style={{ color: '#2563eb' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-sm truncate"
                              style={{ color: '#1e293b' }}
                            >
                              {asset.makeModel}
                            </p>
                            <div
                              className="flex flex-wrap items-center gap-2 mt-0.5 text-xs"
                              style={{ color: '#94a3b8' }}
                            >
                              <span className="flex items-center gap-1">
                                <Tag size={10} />
                                {asset.assetTag}
                              </span>
                              <span>·</span>
                              <span>S/N: {asset.serialNumber}</span>
                              <span>·</span>
                              <span>Purchased {fmt(asset.purchaseDate)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                              style={{
                                background: cs.bg,
                                color: cs.text,
                                borderColor: cs.border,
                              }}
                            >
                              {asset.condition}
                            </span>
                            <div className="hidden md:flex flex-col items-end text-xs">
                              <span style={{ color: '#94a3b8' }}>Type</span>
                              <span
                                className="font-semibold"
                                style={{ color: '#1e293b' }}
                              >
                                {asset.type}
                              </span>
                            </div>
                            <div className="hidden lg:flex flex-col items-end text-xs">
                              <span style={{ color: '#94a3b8' }}>Warranty</span>
                              <span
                                className="font-semibold"
                                style={{ color: '#1e293b' }}
                              >
                                {fmt(asset.warrantyExpiry)}
                              </span>
                            </div>
                            <div className="hidden lg:flex flex-col items-end text-xs">
                              <span style={{ color: '#94a3b8' }}>Assigned</span>
                              <span
                                className="font-semibold"
                                style={{ color: '#1e293b' }}
                              >
                                {fmt(asset.assignedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <Laptop size={40} style={{ color: '#cbd5e1' }} />
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      No assets assigned.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* FINANCIALS */}
            {activeTab === 'financials' && (
              <div className="max-w-sm">
                <Card>
                  <CardTitle icon={CreditCard}>Compensation</CardTitle>
                  <div
                    className="py-4 mb-4"
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <p
                      className="text-xs uppercase tracking-widest font-bold mb-1"
                      style={{ color: '#94a3b8' }}
                    >
                      Base Salary
                    </p>
                    <p
                      className="text-4xl font-bold"
                      style={{
                        color: '#1e293b',
                        fontFamily: "'Lora', Georgia, serif",
                      }}
                    >
                      {profileData.salary ? (
                        `₹${profileData.salary.toLocaleString('en-IN')}`
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                          Not Disclosed
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                      per annum
                    </p>
                  </div>
                  <div
                    className="flex items-start gap-2.5 p-3.5 rounded-xl"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <AlertCircle
                      size={14}
                      style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }}
                    />
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: '#94a3b8' }}
                    >
                      For detailed salary structures, tax breakdowns, and
                      payslips, visit the{' '}
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        Payroll
                      </span>{' '}
                      section.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* ACTION HISTORY */}
            {activeTab === 'actions' && (
              <div className="max-w-2xl">
                <Card>
                  <CardTitle icon={Activity}>Formal HR Actions</CardTitle>
                  
                  {actionHistory.length > 0 ? (
                    <div className="space-y-4 mt-2">
                      {actionHistory.map(h => (
                        <div key={h.id} className="p-4 rounded-xl" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                                   {h.actionType.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                                   Effective: {fmt(h.effectiveDate)}
                                </p>
                             </div>
                             <span className="px-2 py-0.5 text-xs font-bold rounded-md uppercase" style={{ 
                               background: h.status === 'COMPLETED' ? '#dcfce7' : h.status === 'PENDING' ? '#fef3c7' : '#f1f5f9', 
                               color: h.status === 'COMPLETED' ? '#166534' : h.status === 'PENDING' ? '#92400e' : '#475569' 
                             }}>
                                {h.status}
                             </span>
                          </div>
                          <p className="text-sm mt-3" style={{ color: '#475569', lineHeight: '1.5' }}>
                            {h.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                       <Activity size={32} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                       <p className="text-sm font-semibold" style={{ color: '#64748b' }}>No actions found.</p>
                       <p className="text-xs" style={{ color: '#94a3b8', marginTop: 4 }}>You have no formal HR actions recorded.</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
