import React, { useState, useEffect } from 'react';
import { adjustBalanceManually, getAllLeavePolicies } from '../../api/leaveApi';
import { getAllEmployees } from '../../api/employeeApi';
import './LeaveBalanceOverridePage.css';

const LeaveBalanceOverridePage = () => {
  const [employees, setEmployees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [transactionType, setTransactionType] = useState('ADJUSTMENT');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empData, polData] = await Promise.all([
          getAllEmployees(),
          getAllLeavePolicies(),
        ]);
        setEmployees(empData || []);
        setPolicies(polData || []);
      } catch (err) {
        setError('Failed to load employees or policies.');
        console.error(err);
      }
    };
    loadData();
  }, []);

  const isFormValid =
    selectedEmployee && selectedPolicy && days !== '' && reason.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await adjustBalanceManually({
        employeeId: selectedEmployee,
        policyId: selectedPolicy,
        transactionType,
        days: parseFloat(days),
        reason,
      });
      setSuccess(
        'Balance adjusted successfully! A ledger transaction has been recorded.'
      );
      setDays('');
      setReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="override-page">
      <div className="override-header">
        <h1>⚖️ Leave Balance Override</h1>
        <p>
          Manually credit or debit an employee's leave balance. Every adjustment
          is recorded in the immutable ledger.
        </p>
      </div>

      <form className="override-form" onSubmit={handleSubmit}>
        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <div className="form-group">
          <label>Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.userName})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Leave Policy</label>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
          >
            <option value="">-- Select Policy --</option>
            {policies.map((pol) => (
              <option key={pol.id} value={pol.id}>
                {pol.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Transaction Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="ACCRUAL">Accrual (Credit)</option>
              <option value="DEDUCTION">Deduction (Debit)</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div className="form-group">
            <label>Days</label>
            <input
              type="number"
              step="0.5"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g., 3 or -2"
            />
          </div>
        </div>

        <div className="form-group required">
          <label>Reason (Mandatory)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Carry-forward correction, special approval by Director..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Processing...' : '💾 Apply Adjustment'}
        </button>
      </form>
    </div>
  );
};

export default LeaveBalanceOverridePage;
