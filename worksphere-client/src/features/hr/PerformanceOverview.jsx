import React, { useState, useEffect } from "react";
import { fetchAllAppraisals, createAppraisal } from "../../api/hrApi";
import { getAllEmployees } from "../../api/employeeApi";

const PerformanceOverview = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    cycleType: "QUARTERLY",
    reviewPeriodStart: "",
    reviewPeriodEnd: "",
  });

  const loadAppraisals = async () => {
    try {
      setLoading(true);
      const res = await fetchAllAppraisals();
      setAppraisals(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load appraisals"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error("Failed to load employees for dropdown", err);
    }
  };

  useEffect(() => {
    loadAppraisals();
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAppraisal(formData);
      setIsModalOpen(false);
      loadAppraisals();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating appraisal");
    }
  };

  const statusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_REVIEW: "bg-blue-100 text-blue-800",
      REVIEWED: "bg-purple-100 text-purple-800",
      ACKNOWLEDGED: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading Performance Data...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Appraisals</h1>
          <p className="text-gray-500 text-sm mt-1">Manage company-wide appraisal cycles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          + Initiate Appraisal
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">Employee</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Manager</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Cycle</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Period</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appraisals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No appraisals found.
                  </td>
                </tr>
              ) : (
                appraisals.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{app.employeeName}</td>
                    <td className="p-4 text-gray-600">{app.managerName}</td>
                    <td className="p-4 text-gray-600">{app.cycleType}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {app.reviewPeriodStart} to {app.reviewPeriodEnd}
                    </td>
                    <td className="p-4">{statusBadge(app.status)}</td>
                    <td className="p-4 font-semibold text-gray-900">
                      {app.finalScore ? app.finalScore.toFixed(2) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Initiate Appraisal Cycle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="" disabled>Search or select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.department?.name ? `(${emp.department.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Type</label>
                <select
                  name="cycleType"
                  value={formData.cycleType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="BI_ANNUAL">Bi-Annual</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    name="reviewPeriodStart"
                    required
                    value={formData.reviewPeriodStart}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                  <input
                    type="date"
                    name="reviewPeriodEnd"
                    required
                    value={formData.reviewPeriodEnd}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Initiate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOverview;
