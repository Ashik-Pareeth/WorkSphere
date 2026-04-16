import React, { useEffect, useState } from 'react';
import {
  fetchSalaryStructure,
  fetchSalaryStructureTemplate,
  saveSalaryStructure,
} from '../../api/hrApi';
import SalaryStructureForm from './SalaryStructureForm';
import {
  DEFAULT_SALARY_FORM,
  buildSalaryPayload,
  toSalaryForm,
} from './salaryStructureUtils';

export default function SalaryStructureModal({
  isOpen,
  onClose,
  employee,
  jobPosition,
  onSave,
}) {
  const [salaryForm, setSalaryForm] = useState(DEFAULT_SALARY_FORM);
  const [saving, setSaving] = useState(false);

  const isEmployeeMode = Boolean(employee?.id);
  const targetId = employee?.id || jobPosition?.id;
  const title = isEmployeeMode ? 'Employee Salary Structure' : 'Job Position Template';
  const subtitle = isEmployeeMode
    ? `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim()
    : jobPosition?.positionName || '';

  useEffect(() => {
    if (!isOpen || !targetId) return;

    const loadStructure = async () => {
      try {
        const res = isEmployeeMode
          ? await fetchSalaryStructure(targetId)
          : await fetchSalaryStructureTemplate(targetId);
        setSalaryForm(toSalaryForm(res.data));
      } catch (error) {
        console.error('Failed to load salary structure', error);
        setSalaryForm(DEFAULT_SALARY_FORM);
      }
    };

    loadStructure();
  }, [isOpen, isEmployeeMode, targetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...buildSalaryPayload(salaryForm),
        ...(isEmployeeMode ? { employeeId: employee.id } : { jobPositionId: jobPosition.id }),
      };
      await saveSalaryStructure(payload);
      onSave?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SalaryStructureForm value={salaryForm} onChange={setSalaryForm} />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
