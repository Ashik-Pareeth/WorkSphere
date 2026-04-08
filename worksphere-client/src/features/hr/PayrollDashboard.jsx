import React, { useState, useEffect } from 'react';
import {
  generatePayroll,
  fetchPayrollSummary,
  processPayroll,
  markPayrollPaid,
} from '../../api/hrApi';
import { getAllEmployees } from '../../api/employeeApi';
import PayslipViewerModal from './PayslipViewerModal';
import SalaryStructureModal from './SalaryStructureModal';
import { Skeleton } from '../../components/ui/skeleton';

const PayrollDashboard = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewingPayslipId, setViewingPayslipId] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Salary Structure Modal
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPayrollSummary(month, year);
      setRecords(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load payroll summary'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await generatePayroll({ month, year });
      setRecords(res.data.records);
      setSuccess(`Generated ${res.data.records.length} payroll records.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to generate payroll'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id) => {
    try {
      await processPayroll(id);
      setSuccess('Payroll processed and payslip generated.');
      setTimeout(() => setSuccess(null), 4000);
      loadSummary();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to process payroll'
      );
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPayrollPaid(id);
      setSuccess('Payroll marked as paid.');
      setTimeout(() => setSuccess(null), 4000);
      loadSummary();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to mark as paid'
      );
    }
  };

  const openSalaryModal = (emp) => {
    setSelectedEmployee(emp);
    setSalaryModalOpen(true);
  };

  const statusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-amber-100 text-amber-900 border-amber-200',
      PROCESSED: 'bg-blue-100 text-blue-900 border-blue-200',
      PAID: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    };
    return (
      <span
        className={`px-3 py-1 text-xs rounded-md font-bold border ${colors[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}
      >
        {status}
      </span>
    );
  };

  const fmt = (val) =>
    val != null
      ? Number(val).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Payroll Dashboard
          </h1>
          <p className="text-slate-600 font-medium mt-1">
            Generate, process, and manage monthly payroll.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-800 bg-red-50 p-3 rounded-lg border border-red-200 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-medium">
          {success}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-slate-300 text-slate-900 font-medium rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Year
            </label>
            <input
              type="number"
              min="2020"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-slate-300 text-slate-900 font-medium rounded-lg px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold shadow-sm transition-colors text-sm"
          >
            View Records
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold shadow-sm transition-colors text-sm"
          >
            {loading ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      {/* Salary Structure Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Salary Structures
        </h2>
        <p className="text-sm text-slate-600 font-medium mb-4">
          Click an employee to set or update their salary structure.
        </p>
        <div className="flex flex-wrap gap-2">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => openSalaryModal(emp)}
              className="px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors shadow-sm"
            >
              {emp.firstName} {emp.lastName}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-sm font-bold text-slate-800">
                  Employee
                </th>
                <th className="p-4 text-sm font-bold text-slate-800">
                  Department
                </th>
                <th className="p-4 text-sm font-bold text-slate-800 text-right">
                  Gross
                </th>
                <th className="p-4 text-sm font-bold text-slate-800 text-right">
                  Deductions
                </th>
                <th className="p-4 text-sm font-bold text-slate-800 text-right">
                  Net Pay
                </th>
                <th className="p-4 text-sm font-bold text-slate-800">Days</th>
                <th className="p-4 text-sm font-bold text-slate-800">Status</th>
                <th className="p-4 text-sm font-bold text-slate-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="hover:bg-slate-50">
                    <td className="p-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-24 ml-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </td>
                    <td className="p-4 flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center font-medium text-slate-600"
                  >
                    No records found. Select a period and click View Records or
                    Generate Payroll.
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
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">
                        {r.employeeName}
                      </td>
                      <td className="p-4 text-slate-700 font-medium text-sm">
                        {r.department}
                      </td>
                      <td className="p-4 text-right text-sm font-semibold text-slate-800">
                        ₹{fmt(r.grossPay)}
                      </td>
                      <td className="p-4 text-right text-sm font-semibold text-red-600">
                        -₹{fmt(totalDeductions)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-emerald-700">
                        ₹{fmt(r.netPay)}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-700">
                        {r.presentDays}/{r.workingDays}
                        {r.lopDays > 0 && (
                          <span className="text-red-600 font-bold ml-1">
                            ({r.lopDays} LOP)
                          </span>
                        )}
                      </td>
                      <td className="p-4">{statusBadge(r.status)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {r.status === 'DRAFT' && (
                            <button
                              onClick={() => handleProcess(r.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                              Process
                            </button>
                          )}
                          {r.status === 'PROCESSED' && (
                            <button
                              onClick={() => handleMarkPaid(r.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          {r.payslipDownloadUrl && (
                            <button
                              onClick={() => setViewingPayslipId(r.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              📄 View Payslip
                            </button>
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

      <SalaryStructureModal
        isOpen={salaryModalOpen}
        onClose={() => setSalaryModalOpen(false)}
        employee={selectedEmployee}
        onSave={() => {
          setSuccess('Salary structure saved.');
          setTimeout(() => setSuccess(null), 4000);
        }}
      />

      {/* Payslip Modal */}
      <PayslipViewerModal
        isOpen={!!viewingPayslipId}
        onClose={() => setViewingPayslipId(null)}
        payrollId={viewingPayslipId}
      />
    </div>
  );
};

export default PayrollDashboard;
