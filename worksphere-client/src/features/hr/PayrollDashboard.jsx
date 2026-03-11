import React, { useState, useEffect } from "react";
import {
  generatePayroll,
  fetchPayrollSummary,
  processPayroll,
  markPayrollPaid,
  fetchSalaryStructure,
  saveSalaryStructure,
} from "../../api/hrApi";
import { getAllEmployees } from "../../api/employeeApi";

const PayrollDashboard = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Salary Structure Modal
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: "",
    hra: "0",
    da: "0",
    travelAllowance: "0",
    otherAllowances: "0",
    pfEmployeePercent: "12",
    pfEmployerPercent: "12",
    professionalTax: "200",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPayrollSummary(month, year);
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payroll summary");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await generatePayroll({ month, year });
      setRecords(res.data);
      setSuccess(`Generated ${res.data.length} payroll records.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id) => {
    try {
      await processPayroll(id);
      setSuccess("Payroll processed and payslip generated.");
      setTimeout(() => setSuccess(null), 4000);
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payroll");
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPayrollPaid(id);
      setSuccess("Payroll marked as paid.");
      setTimeout(() => setSuccess(null), 4000);
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  const openSalaryModal = async (emp) => {
    setSelectedEmployee(emp);
    try {
      const res = await fetchSalaryStructure(emp.id);
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
        effectiveDate:
          data.effectiveDate || new Date().toISOString().split("T")[0],
      });
    } catch {
      // Reset form if no structure found
      setSalaryForm({
        baseSalary: "",
        hra: "0",
        da: "0",
        travelAllowance: "0",
        otherAllowances: "0",
        pfEmployeePercent: "12",
        pfEmployerPercent: "12",
        professionalTax: "200",
        effectiveDate: new Date().toISOString().split("T")[0],
      });
    }
    setSalaryModalOpen(true);
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      await saveSalaryStructure({
        ...salaryForm,
        employeeId: selectedEmployee.id,
      });
      setSalaryModalOpen(false);
      setSuccess("Salary structure saved.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save salary structure"
      );
    }
  };

  const statusBadge = (status) => {
    const colors = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      PROCESSED: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  const fmt = (val) =>
    val != null
      ? Number(val).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payroll Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate, process, and manage monthly payroll.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              min="2020"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            View Records
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            {loading ? "Generating..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      {/* Salary Structure Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Salary Structures
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Click an employee to set or update their salary structure.
        </p>
        <div className="flex flex-wrap gap-2">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => openSalaryModal(emp)}
              className="px-3 py-2 text-sm bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-colors"
            >
              {emp.firstName} {emp.lastName}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Employee
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Department
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">
                  Gross
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">
                  Deductions
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">
                  Net Pay
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Days
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    {loading
                      ? "Loading..."
                      : "No records. Select a period and click View Records or Generate Payroll."}
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const totalDeductions =
                    Number(r.lopDeduction || 0) +
                    Number(r.pfDeduction || 0) +
                    Number(r.taxDeduction || 0) +
                    Number(r.professionalTax || 0) +
                    Number(r.otherDeductions || 0);

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">
                        {r.employeeName}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {r.department}
                      </td>
                      <td className="p-4 text-right text-sm">
                        ₹{fmt(r.grossPay)}
                      </td>
                      <td className="p-4 text-right text-sm text-red-600">
                        -₹{fmt(totalDeductions)}
                      </td>
                      <td className="p-4 text-right font-semibold text-green-700">
                        ₹{fmt(r.netPay)}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {r.presentDays}/{r.workingDays}
                        {r.lopDays > 0 && (
                          <span className="text-red-500 ml-1">
                            ({r.lopDays} LOP)
                          </span>
                        )}
                      </td>
                      <td className="p-4">{statusBadge(r.status)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {r.status === "DRAFT" && (
                            <button
                              onClick={() => handleProcess(r.id)}
                              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                              Process
                            </button>
                          )}
                          {r.status === "PROCESSED" && (
                            <button
                              onClick={() => handleMarkPaid(r.id)}
                              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          {r.payslipDownloadUrl && (
                            <a
                              href={`http://localhost:8080${r.payslipDownloadUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                            >
                              📄 Payslip
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Structure Modal */}
      {salaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Salary Structure
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </p>
            <form onSubmit={handleSalarySubmit} className="space-y-3">
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
                        setSalaryForm({
                          ...salaryForm,
                          [key]: e.target.value,
                        })
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
                      setSalaryForm({
                        ...salaryForm,
                        pfEmployeePercent: e.target.value,
                      })
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
                      setSalaryForm({
                        ...salaryForm,
                        effectiveDate: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSalaryModalOpen(false)}
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
      )}
    </div>
  );
};

export default PayrollDashboard;
