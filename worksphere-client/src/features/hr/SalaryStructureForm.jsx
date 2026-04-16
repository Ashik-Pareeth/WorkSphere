import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  calculateSalaryGross,
  parseAmount,
} from './salaryStructureUtils';

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
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Gross Salary
            </p>
            <p className="text-sm text-slate-600">
              Flat salary stays synced to this total during finalization.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {grossSalary.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {moneyFields.map(([field, label]) => (
          <div className="grid gap-2" key={field}>
            <Label>{label}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required={field === 'baseSalary'}
              value={value[field]}
              disabled={disabled}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>PF Employee %</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={value.pfEmployeePercent}
            disabled={disabled}
            onChange={(e) =>
              handleFieldChange('pfEmployeePercent', e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>PF Employer %</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={value.pfEmployerPercent}
            disabled={disabled}
            onChange={(e) =>
              handleFieldChange('pfEmployerPercent', e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Effective Date</Label>
          <Input
            type="date"
            required
            value={value.effectiveDate}
            disabled={disabled}
            onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Monthly deductions preview: PF employee {parseAmount(
          value.pfEmployeePercent
        ).toFixed(1)}
        % and professional tax {parseAmount(value.professionalTax).toFixed(2)}.
      </div>
    </div>
  );
}
