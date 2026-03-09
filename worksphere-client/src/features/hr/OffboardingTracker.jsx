import React, { useState, useEffect } from "react";
import { fetchAllOffboardingRecords, initiateOffboarding, updateOffboardingClearance } from "../../api/hrApi";
import { getAllEmployees } from "../../api/employeeApi";

const OffboardingTracker = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    reason: "RESIGNATION",
    lastWorkingDay: "",
    remarks: "",
  });

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await fetchAllOffboardingRecords();
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load offboarding records");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    loadRecords();
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      await initiateOffboarding(formData);
      setIsModalOpen(false);
      loadRecords();
      setFormData({ employeeId: "", reason: "RESIGNATION", lastWorkingDay: "", remarks: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Error initiating offboarding");
    }
  };

  const toggleClearance = async (id, dept, currentValue) => {
    try {
      await updateOffboardingClearance(id, dept, !currentValue);
      loadRecords();
    } catch (err) {
      alert(err.response?.data?.message || `Error updating ${dept} clearance`);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      INITIATED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  const clearanceCheckbox = (recordId, dept, isCleared) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={isCleared}
        onChange={() => toggleClearance(recordId, dept, isCleared)}
        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      />
      <span className="text-sm text-gray-700">{dept}</span>
    </label>
  );

  if (loading) return <div className="p-6">Loading Offboarding Data...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offboarding Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Manage employee departures and clearances.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Initiate Offboarding
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">Employee</th>
                <th className="p-4 text-sm font-semibold text-gray-600">LWD</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Reason</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Clearances Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Overall Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    No offboarding records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{r.employeeName}</td>
                    <td className="p-4 text-gray-600">{r.lastWorkingDay}</td>
                    <td className="p-4 text-sm text-gray-500">{r.reason}</td>
                    <td className="p-4">
                      <div className="flex space-x-4">
                        {clearanceCheckbox(r.id, "IT", r.itClearance)}
                        {clearanceCheckbox(r.id, "HR", r.hrClearance)}
                        {clearanceCheckbox(r.id, "FINANCE", r.financeClearance)}
                      </div>
                    </td>
                    <td className="p-4">{statusBadge(r.status)}</td>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Initiate Offboarding</h2>
            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                >
                  <option value="" disabled>Select mapping employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.department?.name ? `(${emp.department.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="RESIGNATION">Resignation</option>
                  <option value="TERMINATION">Termination</option>
                  <option value="RETIREMENT">Retirement</option>
                  <option value="CONTRACT_END">Contract End</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day</label>
                <input
                  type="date"
                  name="lastWorkingDay"
                  required
                  value={formData.lastWorkingDay}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Optional details..."
                ></textarea>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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

export default OffboardingTracker;
