import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
} from 'lucide-react';
import { getLeaveBoardRecords } from '../../api/leaveApi';

const FILTERS = [
  { key: 'current', label: 'On leave' },
  { key: 'upcoming', label: 'Scheduled' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

const ROLE_SCOPE = {
  MY: 'My leave',
  TEAM: 'My team',
  GLOBAL: 'Global',
};

function cleanRoles(roles = []) {
  return roles.map((role) => {
    const name = typeof role === 'string' ? role : role?.roleName;
    return name ? name.replace(/^ROLE_/, '') : '';
  });
}

function toDateKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function classifyLeave(request, today) {
  if (request.startDate <= today && request.endDate >= today) return 'current';
  if (request.startDate > today) return 'upcoming';
  return 'past';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function employeeName(request) {
  const emp = request.employee;
  if (!emp) return 'Employee';
  return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || 'Employee';
}

function statusStyles(kind) {
  if (kind === 'current')
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (kind === 'upcoming') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function LeavePresenceBoard({ user }) {
  const roles = useMemo(() => cleanRoles(user?.roles), [user?.roles]);
  const canGlobal = roles.some(
    (role) => role === 'HR' || role === 'SUPER_ADMIN'
  );
  const canTeam = roles.includes('MANAGER');
  const canChooseScope = canGlobal && canTeam;
  const defaultScope = canGlobal ? 'GLOBAL' : canTeam ? 'TEAM' : 'MY';

  const [scope, setScope] = useState(defaultScope);
  const [filter, setFilter] = useState('current');
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setScope(defaultScope);
  }, [defaultScope]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaveBoardRecords(scope);
        console.log('Fetched leave records:', data);
        if (!cancelled) setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Failed to load leave records.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const today = todayKey();
  const decorated = useMemo(
    () =>
      records
        .map((record) => ({
          ...record,
          bucket: classifyLeave(record, today),
        }))
        .sort((a, b) => {
          if (a.bucket === 'past' && b.bucket !== 'past') return 1;
          if (a.bucket !== 'past' && b.bucket === 'past') return -1;
          return toDateKey(a.startDate).localeCompare(toDateKey(b.startDate));
        }),
    [records, today]
  );

  const counts = useMemo(
    () =>
      decorated.reduce(
        (acc, record) => {
          acc.all += 1;
          acc[record.bucket] += 1;
          return acc;
        },
        { all: 0, current: 0, upcoming: 0, past: 0 }
      ),
    [decorated]
  );

  const visibleRecords =
    filter === 'all'
      ? decorated
      : decorated.filter((record) => record.bucket === filter);

  const scopeOptions = canChooseScope
    ? [
        { value: 'GLOBAL', label: 'Global' },
        { value: 'TEAM', label: 'My team' },
      ]
    : [{ value: defaultScope, label: ROLE_SCOPE[defaultScope] }];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Leave Calendar
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Current, scheduled, and completed approved leave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
            {counts.current} away now
          </span>
          {canChooseScope ? (
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setExpandedId(null);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="h-9 inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600">
              {ROLE_SCOPE[scope]}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setFilter(item.key);
              setExpandedId(null);
            }}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === item.key
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {item.label} ({counts[item.key]})
          </button>
        ))}
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading leave records...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Search size={24} />
            <p className="mt-2 text-sm font-medium text-gray-700">
              No leave records found.
            </p>
            <p className="mt-1 text-xs">Try another status view or scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Dates</th>
                  <th className="pb-3 pr-4">Days</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Policy</th>
                  <th className="pb-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRecords.map((record) => {
                  const isOpen = expandedId === record.id;
                  return (
                    <React.Fragment key={record.id}>
                      <tr className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {employeeName(record)}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(record.startDate)} -{' '}
                          {formatDate(record.endDate)}
                        </td>
                        <td className="py-3 pr-4 text-sm font-semibold text-gray-900">
                          {record.requestedDays}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyles(record.bucket)}`}
                          >
                            {record.bucket === 'current'
                              ? 'On leave'
                              : record.bucket === 'upcoming'
                                ? 'Scheduled'
                                : 'Was on leave'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-600">
                          {record.leavePolicy?.name || 'Leave'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isOpen ? null : record.id)
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
                            aria-label={
                              isOpen
                                ? 'Hide leave details'
                                : 'Show leave details'
                            }
                          >
                            {isOpen ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="pb-4">
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    Reason
                                  </p>
                                  <p className="mt-1 text-sm text-gray-700">
                                    {record.reason || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    Policy
                                  </p>
                                  <p className="mt-1 text-sm text-gray-700">
                                    {record.leavePolicy?.name || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    Reviewer note
                                  </p>
                                  <p className="mt-1 text-sm text-gray-700">
                                    {record.reviewerComment || '-'}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-500">
                                <span className="rounded-md bg-white border border-gray-200 px-2 py-1">
                                  Requested:{' '}
                                  {record.createdAt
                                    ? formatDate(record.createdAt.slice(0, 10))
                                    : '-'}
                                </span>
                                <span className="rounded-md bg-white border border-gray-200 px-2 py-1">
                                  Request ID: {record.id}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
