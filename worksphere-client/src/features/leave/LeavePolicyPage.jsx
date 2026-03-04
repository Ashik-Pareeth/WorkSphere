import React, { useState, useEffect } from 'react';
import { getAllLeavePolicies, createLeavePolicy } from '../../api/leaveApi';
import './LeavePolicyPage.css';

const LeavePolicyPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [defaultAnnualAllowance, setDefaultAnnualAllowance] = useState('');
  const [allowsCarryForward, setAllowsCarryForward] = useState(false);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState('0');
  const [isUnpaid, setIsUnpaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await getAllLeavePolicies();
      setPolicies(data || []);
    } catch (err) {
      setError('Failed to load leave policies.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !defaultAnnualAllowance) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createLeavePolicy({
        name: name.trim(),
        defaultAnnualAllowance: parseFloat(defaultAnnualAllowance),
        allowsCarryForward,
        maxCarryForwardDays: parseFloat(maxCarryForwardDays) || 0,
        isUnpaid,
      });
      setSuccess(`Policy "${name}" created successfully!`);
      setName('');
      setDefaultAnnualAllowance('');
      setAllowsCarryForward(false);
      setMaxCarryForwardDays('0');
      setIsUnpaid(false);
      setShowForm(false);
      fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create policy.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="policy-page">
      <div className="policy-header">
        <div>
          <h1>📋 Leave Policies</h1>
          <p>Manage the organization's leave policy definitions.</p>
        </div>
        <button className="btn-create" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Policy'}
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {showForm && (
        <form className="policy-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Policy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard PTO, Maternity Leave..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Annual Days Allocated</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={defaultAnnualAllowance}
                onChange={(e) => setDefaultAnnualAllowance(e.target.value)}
                placeholder="e.g., 14"
                required
              />
            </div>
            <div className="form-group">
              <label>Max Carry-Forward Days</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={maxCarryForwardDays}
                onChange={(e) => setMaxCarryForwardDays(e.target.value)}
                disabled={!allowsCarryForward}
              />
            </div>
          </div>

          <div className="form-row-checks">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowsCarryForward}
                onChange={(e) => setAllowsCarryForward(e.target.checked)}
              />
              Allow Carry Forward
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isUnpaid}
                onChange={(e) => setIsUnpaid(e.target.checked)}
              />
              Unpaid Leave
            </label>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={submitting || !name.trim() || !defaultAnnualAllowance}
          >
            {submitting ? 'Creating...' : '💾 Create Policy'}
          </button>
        </form>
      )}

      <div className="policies-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="empty-state">No leave policies configured yet.</div>
        ) : (
          <table className="policies-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Annual Days</th>
                <th>Carry Forward</th>
                <th>Max CF Days</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((pol) => (
                <tr key={pol.id}>
                  <td className="policy-name">{pol.name}</td>
                  <td>{pol.defaultAnnualAllowance}</td>
                  <td>{pol.allowsCarryForward ? '✅ Yes' : '❌ No'}</td>
                  <td>{pol.maxCarryForwardDays}</td>
                  <td>
                    <span
                      className={`type-badge ${pol.isUnpaid ? 'unpaid' : 'paid'}`}
                    >
                      {pol.isUnpaid ? 'Unpaid' : 'Paid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeavePolicyPage;
