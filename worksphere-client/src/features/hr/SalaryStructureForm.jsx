import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateSalaryGross, parseAmount } from './salaryStructureUtils';

const moneyFields = [
  ['baseSalary', 'Base Salary'],
  ['hra', 'HRA'],
  ['da', 'DA'],
  ['travelAllowance', 'Travel Allowance'],
  ['otherAllowances', 'Other Allowances'],
  ['professionalTax', 'Professional Tax'],
];

export default function SalaryStructureForm({
  value,
  onChange,
  disabled = false,
}) {
  const handleFieldChange = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  const grossSalary = calculateSalaryGross(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Salary Structure
        </h2>
        <p className="text-sm text-slate-500">
          Source: Custom in finalize flow
        </p>
      </div>

      {/* Gross Salary */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Gross Salary
            </p>
            <p className="text-sm text-slate-600">
              Auto-calculated from all components
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ₹{' '}
            {grossSalary.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Salary Fields */}
      <div className="grid grid-cols-2 gap-5">
        {moneyFields.map(([field, label]) => (
          <div className="grid gap-1.5" key={field}>
            <Label className="text-sm font-medium text-slate-700">
              {label}
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required={field === 'baseSalary'}
              value={value[field]}
              disabled={disabled}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="
              bg-white
              text-slate-900
              border border-slate-300
              rounded-md
              px-3 py-2
              shadow-sm
              focus:border-blue-500
              focus:ring-2 focus:ring-blue-500/20
              transition
            "
            />
          </div>
        ))}
      </div>

      {/* PF + Date */}
      <div className="grid grid-cols-3 gap-5">
        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-slate-700">
            PF Employee %
          </Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={value.pfEmployeePercent}
            disabled={disabled}
            onChange={(e) =>
              handleFieldChange('pfEmployeePercent', e.target.value)
            }
            className="bg-white text-slate-900 border border-slate-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-slate-700">
            PF Employer %
          </Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={value.pfEmployerPercent}
            disabled={disabled}
            onChange={(e) =>
              handleFieldChange('pfEmployerPercent', e.target.value)
            }
            className="bg-white text-slate-900 border border-slate-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-slate-700">
            Effective Date
          </Label>
          <Input
            type="date"
            required
            value={value.effectiveDate}
            disabled={disabled}
            onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
            className="bg-white text-slate-900 border border-slate-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Monthly deductions preview: PF employee{' '}
        {parseAmount(value.pfEmployeePercent).toFixed(1)}% and professional tax
        ₹{parseAmount(value.professionalTax).toFixed(2)}.
      </div>
    </div>
  );
}
