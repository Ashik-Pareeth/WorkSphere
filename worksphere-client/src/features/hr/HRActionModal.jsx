import React, { useState, useEffect } from 'react';
import {
  applyEmployeeAction,
  getEmployeeActionHistory,
} from '../../api/employeeActionApi';
import axiosInstance from '../../api/axiosInstance';
import {
  TrendingUp,
  TrendingDown,
  ShieldOff,
  Coffee,
  ShieldCheck,
  DollarSign,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react';
import SalaryStructureForm from './SalaryStructureForm';
import {
  buildSalaryPayload,
  calculateSalaryGross,
  DEFAULT_SALARY_FORM,
  parseAmount,
  toSalaryForm,
} from './salaryStructureUtils';
import { fetchSalaryStructureTemplate } from '../../api/hrApi';

const ACTION_TYPES = [
  {
    value: 'PROMOTION',
    label: 'Promotion',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    needsPosition: true,
    needsSalary: true,
  },
  {
    value: 'DEMOTION',
    label: 'Demotion',
    icon: TrendingDown,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    needsPosition: true,
    needsSalary: true,
  },
  {
    value: 'SUSPENSION',
    label: 'Suspension',
    icon: ShieldOff,
    color: 'text-red-600',
    bg: 'bg-red-50',
    needsEndDate: true,
  },
  {
    value: 'FORCED_LEAVE',
    label: 'Forced Leave',
    icon: Coffee,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    needsEndDate: true,
  },
  {
    value: 'REINSTATEMENT',
    label: 'Reinstatement',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'SALARY_REVISION',
    label: 'Salary Revision',
    icon: DollarSign,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    needsSalary: true,
  },
  {
    value: 'TRANSFER',
    label: 'Transfer',
    icon: ArrowRightLeft,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    needsPosition: true,
    needsDept: true,
  },
  {
    value: 'WARNING_ISSUED',
    label: 'Issue Warning',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

const STATUS_STYLE = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-yellow-100  text-yellow-700',
  APPROVED: 'bg-blue-100    text-blue-700',
  REJECTED: 'bg-red-100     text-red-700',
};

const ACTION_ICON_MAP = {
  PROMOTION: TrendingUp,
  DEMOTION: TrendingDown,
  SUSPENSION: ShieldOff,
  EMERGENCY_SUSPENSION: ShieldOff,
  FORCED_LEAVE: Coffee,
  REINSTATEMENT: ShieldCheck,
  SALARY_REVISION: DollarSign,
  TRANSFER: ArrowRightLeft,
  WARNING_ISSUED: AlertTriangle,
  MANAGER_REPORT: Clock,
};

export default function HRActionModal({
  employee,
  pendingRecordId,
  onClose,
  onActionApplied,
}) {
  const [tab, setTab] = useState('action'); // 'action' | 'history'
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    reason: '',
    effectiveDate: '',
    endDate: '',
    newJobPosition: '',
    newDepartment: '',
  });
  const [salaryForm, setSalaryForm] = useState(DEFAULT_SALARY_FORM);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  useEffect(() => {
    axiosInstance.get('/departments').then(res => setDepts(res.data)).catch(() => {});
    axiosInstance.get('/jobPositions').then(res => setPositions(res.data)).catch(() => {});
  }, []);

  const loadTemplateForPosition = async (positionId) => {
    try {
      const res = await fetchSalaryStructureTemplate(positionId);
      if (res.data) {
        setSalaryForm(toSalaryForm(res.data));
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // expected if template doesn't exist
      } else {
        console.error('Failed to load salary template for position', err);
      }
    }
  };

  useEffect(() => {
    if (form.newJobPosition) {
      const pos = positions.find(p => p.positionName === form.newJobPosition);
      if (pos) {
        loadTemplateForPosition(pos.id);
      }
    }
  }, [form.newJobPosition, positions]);

  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const res = await getEmployeeActionHistory(employee.id);
      setHistory(res.data);
    } catch {
      /* ignore */
    } finally {
      setHistLoading(false);
    }
  };

  const selected = ACTION_TYPES.find((a) => a.value === selectedType);

  const handleSubmit = async () => {
    if (!selectedType) return setError('Please select an action type.');
    if (!form.reason.trim()) return setError('Reason is strictly required.');
    if (!form.effectiveDate) return setError('Effective Date is required.');

    if (selected?.needsEndDate && (!form.endDate || new Date(form.endDate) <= new Date(form.effectiveDate))) {
      return setError('An End Date must be provided and must be after the Effective Date.');
    }
    if (selected?.needsPosition && !form.newJobPosition) {
      return setError('New Job Position is required.');
    }
    if (selected?.needsDept && !form.newDepartment) {
      return setError('New Department is required.');
    }
    if (selected?.needsSalary && parseAmount(salaryForm.baseSalary) <= 0) {
      return setError('A valid positive base salary is required.');
    }

    let computedGross = null;
    let salaryPayload = {};
    if (selected?.needsSalary) {
      computedGross = parseAmount(calculateSalaryGross(salaryForm));
      salaryPayload = buildSalaryPayload(salaryForm);
    }

    setLoading(true);
    setError(null);
    try {
      await applyEmployeeAction({
        employeeId: employee.id,
        actionType: selectedType,
        reason: form.reason,
        effectiveDate: form.effectiveDate || null,
        endDate: form.endDate || null,
        newJobPosition: form.newJobPosition || null,
        newDepartment: form.newDepartment || null,
        newSalary: computedGross,
        ...salaryPayload,
      });
      if (pendingRecordId) {
        const api = await import('../../api/employeeActionApi');
        await api.reviewReport(pendingRecordId, true, "Formal action applied & formalized.");
      }
      setSuccess('Action applied successfully.');

      onActionApplied?.();
      setTimeout(() => {
        setSuccess(null);
        setSelectedType(null);
        setForm({
          reason: '',
          effectiveDate: '',
          endDate: '',
          newJobPosition: '',
          newDepartment: '',
        });
        setSalaryForm(DEFAULT_SALARY_FORM);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to apply action.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Employee Actions
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {employee.firstName} {employee.lastName} &mdash;{' '}
              {employee.jobTitle ?? 'No position'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {['action', 'history'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 mr-4 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              {t === 'action' ? 'Take Action' : 'Action History'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'action' && (
            <div className="space-y-5">
              {/* Action type grid */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Select Action
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ACTION_TYPES.map((a) => {
                    const Icon = a.icon;
                    const active = selectedType === a.value;
                    return (
                      <button
                        key={a.value}
                        onClick={() => {
                          setSelectedType(a.value);
                          setError(null);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                          active
                            ? `${a.bg} border-current ${a.color} ring-2 ring-offset-1 ring-current`
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[11px] font-medium leading-tight">
                          {a.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic fields */}
              {selected && (
                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Reason *
                    </label>
                    <textarea
                      rows={3}
                      value={form.reason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      placeholder="Provide a clear reason for this action…"
                      className="w-full rounded-lg border text-black border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Effective Date *
                      </label>
                      <input
                        type="date"
                        value={form.effectiveDate}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            effectiveDate: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border text-black border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {selected.needsEndDate && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, endDate: e.target.value }))
                          }
                          className="w-full rounded-lg border text-black border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    {selected.needsPosition && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          New Job Position
                        </label>
                        <select
                          value={form.newJobPosition}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              newJobPosition: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border text-black border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Select Position —</option>
                          {positions.map((p) => (
                            <option key={p.id} value={p.positionName}>
                              {p.positionName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selected.needsDept && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          New Department
                        </label>
                        <select
                          value={form.newDepartment}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              newDepartment: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border text-black border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Select Department —</option>
                          {depts.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selected.needsSalary && (
                      <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          New Salary Structure
                        </label>
                        <SalaryStructureForm
                          value={salaryForm}
                          onChange={setSalaryForm}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2">
                  {success}
                </p>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {histLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">
                  No actions recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => {
                    const Icon = ACTION_ICON_MAP[h.actionType] ?? Clock;
                    return (
                      <div
                        key={h.id}
                        className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div className="p-2 rounded-lg bg-white border border-gray-200 shrink-0">
                          <Icon size={14} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">
                              {h.actionType.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[h.status] ?? 'bg-gray-100 text-gray-500'}`}
                            >
                              {h.status}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto shrink-0">
                              {h.effectiveDate}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {h.reason}
                          </p>
                          
                          {(h.previousJobPosition || h.newJobPosition || h.previousSalary != null || h.newSalary != null) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                              {(h.previousJobPosition || h.newJobPosition) && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Position</p>
                                  <p className="text-xs text-gray-700">
                                    {h.previousJobPosition || 'None'} <span className="text-gray-400 mx-1">&rarr;</span> <span className="font-semibold">{h.newJobPosition || 'None'}</span>
                                  </p>
                                </div>
                              )}
                              {(h.previousSalary != null || h.newSalary != null) && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Salary</p>
                                  <p className="text-xs text-gray-700">
                                    {h.previousSalary ? `₹${h.previousSalary.toLocaleString()}` : 'None'} <span className="text-gray-400 mx-1">&rarr;</span> <span className="font-semibold">{h.newSalary ? `₹${h.newSalary.toLocaleString()}` : 'None'}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                            By {h.initiatedByName} ({h.initiatedByRole})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'action' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedType}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition"
            >
              {loading ? 'Applying…' : 'Apply Action'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
