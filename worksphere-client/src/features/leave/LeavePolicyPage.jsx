import { useState, useEffect, useCallback } from 'react';
import { getAllLeavePolicies, createLeavePolicy } from '../../api/leaveApi';
import '../../styles/admin-ui.css';

import {
  ClipboardList,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  BadgeCheck,
  Ban,
} from 'lucide-react';

function LeavePolicyPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [defaultAnnualAllowance, setDefaultAnnualAllowance] = useState('');
  const [allowsCarryForward, setAllowsCarryForward] = useState(false);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState('0');
  const [isUnpaid, setIsUnpaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = useCallback(async (isMounted = true) => {
    setLoading(true);
    try {
      const data = await getAllLeavePolicies();
      if (isMounted) setPolicies(data || []);
    } catch (err) /* eslint-disable-line no-unused-vars */ {
      if (isMounted)
        setAlert({ type: 'error', message: 'Failed to load leave policies.' });
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchPolicies(active);
    return () => {
      active = false;
    };
  }, [fetchPolicies]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  const resetForm = () => {
    setName('');
    setDefaultAnnualAllowance('');
    setAllowsCarryForward(false);
    setMaxCarryForwardDays('0');
    setIsUnpaid(false);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !defaultAnnualAllowance) return;
    setSubmitting(true);
    try {
      await createLeavePolicy({
        name: name.trim(),
        defaultAnnualAllowance: parseFloat(defaultAnnualAllowance),
        allowsCarryForward,
        maxCarryForwardDays: parseFloat(maxCarryForwardDays) || 0,
        isUnpaid,
      });
      setAlert({ type: 'success', message: `Policy "${name}" created.` });
      resetForm();
      fetchPolicies();
    } catch (err) /* eslint-disable-line no-unused-vars */ {
      setAlert({ type: 'error', message: 'Failed to create policy.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ws-page">
      {/* TOP BAR */}
      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box" style={{ background: '#2563eb' }}>
            <ClipboardList size={20} color="#fff" />
          </div>
          <div>
            <div
              className="ws-page-title"
              style={{ color: '#0f172a', fontWeight: 800 }}
            >
              Leave Policies
            </div>
            <div className="ws-page-sub" style={{ color: '#64748b' }}>
              Manage organization-wide leave types
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="ws-input"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 30,
                width: 220,
                marginBottom: 0,
                background: '#fff',
              }}
            />
          </div>
          <button
            className={`ws-btn ${showForm ? 'ws-btn-secondary' : 'ws-btn-primary'}`}
            onClick={showForm ? resetForm : () => setShowForm(true)}
          >
            {showForm ? (
              <>
                <X size={13} /> Cancel
              </>
            ) : (
              <>
                <Plus size={13} /> Add policy
              </>
            )}
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`ws-alert ws-alert-${alert.type}`}
          style={{ fontWeight: 600 }}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {alert.message}
        </div>
      )}

      {showForm && (
        <div
          className="ws-panel"
          style={{ marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}
        >
          <div className="ws-panel-body">
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 15,
                  marginBottom: 15,
                }}
              >
                <div className="ws-field">
                  <label className="ws-label" style={{ color: '#334155' }}>
                    Policy Name
                  </label>
                  <input
                    className="ws-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Annual Leave"
                    required
                  />
                </div>
                <div className="ws-field">
                  <label className="ws-label" style={{ color: '#334155' }}>
                    Annual Allocation (Days)
                  </label>
                  <input
                    className="ws-input"
                    type="number"
                    step="0.5"
                    value={defaultAnnualAllowance}
                    onChange={(e) => setDefaultAnnualAllowance(e.target.value)}
                    placeholder="15"
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 15,
                  marginBottom: 15,
                }}
              >
                <div className="ws-field">
                  <label className="ws-label" style={{ color: '#334155' }}>
                    Options
                  </label>
                  <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1e293b',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allowsCarryForward}
                        onChange={(e) =>
                          setAllowsCarryForward(e.target.checked)
                        }
                      />{' '}
                      Carry Forward
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1e293b',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isUnpaid}
                        onChange={(e) => setIsUnpaid(e.target.checked)}
                      />{' '}
                      Unpaid Leave
                    </label>
                  </div>
                </div>
                <div className="ws-field">
                  <label
                    className="ws-label"
                    style={{
                      color: allowsCarryForward ? '#334155' : '#cbd5e1',
                    }}
                  >
                    Max Carry Forward
                  </label>
                  <input
                    className="ws-input"
                    type="number"
                    disabled={!allowsCarryForward}
                    value={maxCarryForwardDays}
                    onChange={(e) => setMaxCarryForwardDays(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="ws-btn ws-btn-primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                <Save size={14} />{' '}
                {submitting ? 'Saving...' : 'Create Leave Policy'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABLE PANEL */}
      <div className="ws-panel" style={{ border: '1px solid #e2e8f0' }}>
        <table className="ws-table">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th
                className="ws-th"
                style={{ color: '#475569', fontWeight: 700 }}
              >
                POLICY NAME
              </th>
              <th
                className="ws-th"
                style={{ color: '#475569', fontWeight: 700 }}
              >
                ANNUAL ALLOCATION
              </th>
              <th
                className="ws-th"
                style={{ color: '#475569', fontWeight: 700 }}
              >
                CARRY FORWARD
              </th>
              <th
                className="ws-th"
                style={{ color: '#475569', fontWeight: 700 }}
              >
                MAX CARRY FORWARD
              </th>
              <th
                className="ws-th text-right"
                style={{ color: '#475569', fontWeight: 700 }}
              >
                TYPE
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ws-tr">
                <td
                  colSpan={5}
                  className="ws-td"
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#64748b',
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : filteredPolicies.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="ws-td"
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#64748b',
                  }}
                >
                  No policies found.
                </td>
              </tr>
            ) : (
              filteredPolicies.map((pol) => (
                <tr key={pol.id} className="ws-tr">
                  <td className="ws-td">
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: pol.isUnpaid ? '#f59e0b' : '#3b82f6',
                        }}
                      />
                      {pol.name}
                    </div>
                  </td>
                  <td className="ws-td">
                    <span
                      style={{
                        color: '#1e293b',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      }}
                    >
                      {pol.defaultAnnualAllowance} Days
                    </span>
                  </td>
                  <td className="ws-td">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: pol.allowsCarryForward
                          ? '#f0fdf4'
                          : '#f8fafc',
                        color: pol.allowsCarryForward ? '#15803d' : '#64748b',
                        border: `1px solid ${pol.allowsCarryForward ? '#bbf7d0' : '#e2e8f0'}`,
                      }}
                    >
                      {pol.allowsCarryForward ? (
                        <BadgeCheck size={12} />
                      ) : (
                        <Ban size={12} />
                      )}
                      {pol.allowsCarryForward ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="ws-td">
                    <span style={{ color: '#475569', fontWeight: 600 }}>
                      {pol.maxCarryForwardDays} Days
                    </span>
                  </td>
                  <td className="ws-td text-right">
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 900,
                        background: pol.isUnpaid ? '#fff7ed' : '#eff6ff',
                        color: pol.isUnpaid ? '#c2410c' : '#1d4ed8',
                        border: `1px solid ${pol.isUnpaid ? '#ffedd5' : '#dbeafe'}`,
                      }}
                    >
                      {pol.isUnpaid ? 'UNPAID' : 'PAID'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeavePolicyPage;
