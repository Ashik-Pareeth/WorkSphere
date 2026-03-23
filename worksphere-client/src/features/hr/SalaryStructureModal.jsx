import React, { useState } from "react";
import { fetchSalaryStructure, saveSalaryStructure } from "../../api/hrApi";

const DEFAULT_SALARY_FORM = {
  baseSalary: "",
  hra: "0",
  da: "0",
  travelAllowance: "0",
  otherAllowances: "0",
  pfEmployeePercent: "12",
  pfEmployerPercent: "12",
  professionalTax: "200",
  effectiveDate: new Date().toISOString().split("T")[0],
};

export default function SalaryStructureModal({ isOpen, onClose, employee, onSave }) {
  const [salaryForm, setSalaryForm] = useState(DEFAULT_SALARY_FORM);

  // Fetch existing structure when modal opens
  React.useEffect(() => {
    if (!isOpen || !employee) return;
    fetchSalaryStructure(employee.id)
      .then((res) => {
        const data = res.data;
        setSalaryForm({
          baseSalary: data.baseSalary || "",
          hra: data.hra || "0",
          da: data.da || "0",
          travelAllowance: data.travelAllowance || "0",
          otherAllowances: data.otherAllowances || "0",
          pfEmployeePercent: data.pfEmployeePercent || "12",
          pfEmployerPercent: data.pfEmployerPercent || "12",
          professionalTax: data.professionalTax || "200",
          effectiveDate: data.effectiveDate || new Date().toISOString().split("T")[0],
        });
      })
      .catch(() => {
        setSalaryForm(DEFAULT_SALARY_FORM);
      });
  }, [isOpen, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveSalaryStructure({ ...salaryForm, employeeId: employee.id });
    onSave?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Salary Structure</h2>
        <p className="text-sm text-gray-500 mb-4">
          {employee?.firstName} {employee?.lastName}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["baseSalary", "Base Salary"],
              ["hra", "HRA"],
              ["da", "DA"],
              ["travelAllowance", "Travel Allowance"],
              ["otherAllowances", "Other Allowances"],
              ["professionalTax", "Professional Tax"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required={key === "baseSalary"}
                  value={salaryForm[key]}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, [key]: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PF Employee %
              </label>
              <input
                type="number"
                step="0.1"
                value={salaryForm.pfEmployeePercent}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, pfEmployeePercent: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                required
                value={salaryForm.effectiveDate}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, effectiveDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Save Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
