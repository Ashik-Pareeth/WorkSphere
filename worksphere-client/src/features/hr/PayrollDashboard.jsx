import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AuditTrail } from '../../components/common/AuditTrail';
import {
  generatePayroll,
  fetchPayrollSummary,
  processPayroll,
  markPayrollPaid,
} from '../../api/hrApi';
import { getAllEmployees } from '../../api/employeeApi';
import axiosInstance from '../../api/axiosInstance';
import PayslipViewerModal from './PayslipViewerModal';
import SalaryStructureModal from './SalaryStructureModal';
import { Skeleton } from '../../components/ui/skeleton';

const PayrollDashboard = () => {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
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
  const [selectedJobPosition, setSelectedJobPosition] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    loadDirectoryData();
  }, []);

  const loadDirectoryData = async () => {
    try {
      const [employeeRes, jobPositionRes] = await Promise.all([
        getAllEmployees(),
        axiosInstance.get('/jobPositions'),
      ]);
      setEmployees(employeeRes);
      setJobPositions(jobPositionRes.data);
    } catch (err) {
      console.error('Failed to load payroll directories', err);
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
    setSelectedJobPosition(null);
    setSalaryModalOpen(true);
  };

  const openJobPositionSalaryModal = (jobPosition) => {
    setSelectedEmployee(null);
    setSelectedJobPosition(jobPosition);
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Job Position Templates
        </h2>
        <p className="text-sm text-slate-600 font-medium mb-4">
          Maintain reusable salary templates by position. Finalize hire will load from these defaults and then create an employee-specific copy.
        </p>
        <div className="flex flex-wrap gap-2">
          {jobPositions.map((position) => (
            <button
              key={position.id}
              onClick={() => openJobPositionSalaryModal(position)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {position.positionName}
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
                  const overtimePay = Number(r.overtimePay || 0);
                  const performanceBonus = Number(r.performanceBonus || 0);
                  const totalEarnings =
                    Number(r.grossPay || 0) + overtimePay + performanceBonus;
                  const isExpanded = expandedRow === r.id;

                  return (
                    <>
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50 cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/60' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                      >
                        <td className="p-4 font-bold text-slate-900">
                          <span className="mr-2 text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          {r.employeeName}
                        </td>
                        <td className="p-4 text-slate-700 font-medium text-sm">
                          {r.department}
                        </td>
                        <td className="p-4 text-right text-sm font-semibold text-slate-800">
                          ₹{fmt(r.grossPay)}
                          {overtimePay > 0 && (
                            <span className="block text-[11px] text-emerald-600 font-medium">+₹{fmt(overtimePay)} OT</span>
                          )}
                          <span className="block text-[11px] text-indigo-600 font-medium">
                            Bonus ₹{fmt(performanceBonus)}
                          </span>
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
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
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

                      {/* ── Expandable Breakdown Panel ── */}
                      {isExpanded && (
                        <tr key={`${r.id}-breakdown`} className="bg-indigo-50/40">
                          <td colSpan="8" className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Earnings */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">Earnings</p>
                                <table className="w-full text-sm border-collapse">
                                  <tbody>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">Basic / Gross Pay</td>
                                      <td className="py-1.5 text-right font-semibold text-slate-800">₹{fmt(r.grossPay)}</td>
                                    </tr>
                                    {overtimePay > 0 && (
                                      <tr className="border-b border-slate-200">
                                        <td className="py-1.5 text-slate-600">
                                          Overtime Pay
                                          <span className="ml-1 text-[10px] text-slate-400">(1.5× hourly rate)</span>
                                        </td>
                                        <td className="py-1.5 text-right font-semibold text-emerald-600">+₹{fmt(overtimePay)}</td>
                                      </tr>
                                    )}
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">
                                        Performance Bonus
                                        {r.performanceScore != null ? (
                                          <span className="ml-1 text-[10px] text-slate-400">
                                            ({Number(r.performanceScore).toFixed(2)}/5)
                                          </span>
                                        ) : (
                                          <span className="ml-1 text-[10px] text-slate-400">
                                            (No acknowledged appraisal)
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1.5 text-right font-semibold text-indigo-600">+₹{fmt(performanceBonus)}</td>
                                    </tr>
                                    <tr className="bg-indigo-100/60">
                                      <td className="py-2 font-bold text-indigo-800">Total Earnings</td>
                                      <td className="py-2 text-right font-bold text-indigo-800">₹{fmt(totalEarnings)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Deductions */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">Deductions</p>
                                <table className="w-full text-sm border-collapse">
                                  <tbody>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">LOP Deduction</td>
                                      <td className="py-1.5 text-right text-red-600 font-semibold">-₹{fmt(r.lopDeduction)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">Provident Fund (Employee)</td>
                                      <td className="py-1.5 text-right text-red-600 font-semibold">-₹{fmt(r.pfDeduction)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">Tax Deduction (TDS)</td>
                                      <td className="py-1.5 text-right text-red-600 font-semibold">-₹{fmt(r.taxDeduction)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">Professional Tax</td>
                                      <td className="py-1.5 text-right text-red-600 font-semibold">-₹{fmt(r.professionalTax)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                      <td className="py-1.5 text-slate-600">Other Deductions</td>
                                      <td className="py-1.5 text-right text-red-600 font-semibold">-₹{fmt(r.otherDeductions)}</td>
                                    </tr>
                                    <tr className="bg-red-50">
                                      <td className="py-2 font-bold text-red-700">Total Deductions</td>
                                      <td className="py-2 text-right font-bold text-red-700">-₹{fmt(totalDeductions)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Net Pay footer */}
                            <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg px-5 py-3">
                              <div className="text-sm font-semibold opacity-90">NET PAY (Take Home)</div>
                              <div className="text-xl font-extrabold tracking-tight">₹{fmt(r.netPay)}</div>
                            </div>

                            {/* Audit metadata — HR/Admin/Auditor only */}
                            <AuditTrail user={user} record={r} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SalaryStructureModal
        isOpen={salaryModalOpen}
        onClose={() => {
          setSalaryModalOpen(false);
          setSelectedEmployee(null);
          setSelectedJobPosition(null);
        }}
        employee={selectedEmployee}
        jobPosition={selectedJobPosition}
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
