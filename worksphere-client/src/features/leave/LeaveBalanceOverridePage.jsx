import { adjustBalanceManually, getAllLeavePolicies } from '../../api/leaveApi';
import { getAllEmployees } from '../../api/employeeApi';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useEffect, useState } from 'react';
import '../../styles/admin-ui.css';

import {
  Scale,
  CheckCircle2,
  XCircle,
  X,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
} from 'lucide-react';

const TRANSACTION_TYPES = [
  {
    value: 'ACCRUAL',
    label: 'Accrual',
    sub: 'Credit days to balance',
    icon: <TrendingUp size={15} />,
    color: 'var(--ws-green)',
    bg: 'var(--ws-green-bg)',
    bdr: 'var(--ws-green-bdr)',
  },
  {
    value: 'DEDUCTION',
    label: 'Deduction',
    sub: 'Debit days from balance',
    icon: <TrendingDown size={15} />,
    color: 'var(--ws-red)',
    bg: 'var(--ws-red-bg)',
    bdr: 'var(--ws-red-bdr)',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustment',
    sub: 'Manual correction entry',
    icon: <SlidersHorizontal size={15} />,
    color: 'var(--ws-amber)',
    bg: 'var(--ws-amber-bg)',
    bdr: 'var(--ws-amber-bdr)',
  },
];

const selectStyle = {
  width: '100%',
  background: 'var(--ws-surface2)',
  border: '1px solid var(--ws-border)',
  borderRadius: 9,
  padding: '9px 12px',
  fontFamily: 'var(--ws-font-sans)',
  fontSize: 13,
  color: 'var(--ws-ink)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b90a0' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function LeaveBalanceOverridePage() {
  const [employees, setEmployees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [transactionType, setTransactionType] = useState('ADJUSTMENT');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empData, polData] = await Promise.all([
          getAllEmployees(),
          getAllLeavePolicies(),
        ]);
        setEmployees(empData || []);
        setPolicies(polData || []);
        console.log('Loaded employees:', empData);
        console.log('Loaded policies:', polData);
      } catch {
        setAlert({
          type: 'error',
          message: 'Failed to load employees or policies.',
        });
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(t);
  }, [alert]);

  const isFormValid =
    selectedEmployee && selectedPolicy && days !== '' && reason.trim();

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setConfirmOpen(true);
  };

  const executeOverride = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await adjustBalanceManually({
        employeeId: selectedEmployee,
        policyId: selectedPolicy,
        transactionType,
        days: parseFloat(days),
        reason,
      });
      setAlert({
        type: 'success',
        message: 'Balance adjusted. A ledger transaction has been recorded.',
      });
      setDays('');
      setReason('');
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to adjust balance.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TRANSACTION_TYPES.find(
    (t) => t.value === transactionType
  );

  return (
    <div className="ws-page">
      {/* TOP BAR */}
      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box">
            <Scale size={20} color="#fff" />
          </div>
          <div>
            <div className="ws-page-title">Leave Balance Override</div>
            <div className="ws-page-sub">
              Manually credit or debit an employee's leave balance
            </div>
          </div>
        </div>
        {/* immutable ledger note */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--ws-ink3)',
            background: 'var(--ws-surface3)',
            border: '1px solid var(--ws-border)',
            borderRadius: 20,
            padding: '4px 12px',
            fontWeight: 500,
          }}
        >
          Every adjustment is ledger-recorded
        </span>
      </div>

      {/* ALERT */}
      {alert && (
        <div className={`ws-alert ws-alert-${alert.type}`}>
          {alert.type === 'success' ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {alert.message}
          <button className="ws-alert-close" onClick={() => setAlert(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* FORM PANEL — narrow, centered */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="ws-panel">
          <div className="ws-panel-head">
            <div className="ws-eyebrow">Configuration</div>
            <div className="ws-panel-title">Apply adjustment</div>
          </div>
          <div className="ws-panel-body">
            <form onSubmit={handlePreSubmit}>
              {/* Employee */}
              <div className="ws-field">
                <label className="ws-label">Employee</label>
                {dataLoading ? (
                  <div
                    className="ws-skeleton"
                    style={{ height: 38, borderRadius: 9 }}
                  />
                ) : (
                  <select
                    style={selectStyle}
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Select an employee…</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Leave Policy */}
              <div className="ws-field">
                <label className="ws-label">Leave policy</label>
                {dataLoading ? (
                  <div
                    className="ws-skeleton"
                    style={{ height: 38, borderRadius: 9 }}
                  />
                ) : (
                  <select
                    style={selectStyle}
                    value={selectedPolicy}
                    onChange={(e) => setSelectedPolicy(e.target.value)}
                  >
                    <option value="">Select a policy…</option>
                    {policies.map((pol) => (
                      <option key={pol.id} value={pol.id}>
                        {pol.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Transaction type — card picker */}
              <div className="ws-field">
                <label className="ws-label">Transaction type</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {TRANSACTION_TYPES.map((t) => {
                    const active = transactionType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTransactionType(t.value)}
                        style={{
                          fontFamily: 'var(--ws-font-sans)',
                          padding: '10px 10px 10px 12px',
                          borderRadius: 10,
                          border: `1px solid ${active ? t.bdr : 'var(--ws-border)'}`,
                          background: active ? t.bg : 'var(--ws-surface2)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.14s',
                        }}
                      >
                        <div
                          style={{
                            color: active ? t.color : 'var(--ws-ink3)',
                            marginBottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {t.icon}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: active ? t.color : 'var(--ws-ink2)',
                            marginBottom: 2,
                          }}
                        >
                          {t.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: active ? t.color : 'var(--ws-ink3)',
                          }}
                        >
                          {t.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days */}
              <div className="ws-field">
                <label className="ws-label">
                  Days{' '}
                  <span className="ws-label-muted">
                    (use negative to debit, e.g. −2)
                  </span>
                </label>
                <input
                  className="ws-input"
                  type="number"
                  step="0.5"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g. 3 or -2"
                  style={
                    days && parseFloat(days) < 0
                      ? {
                          borderColor: 'var(--ws-red-bdr)',
                          background: 'var(--ws-red-bg)',
                        }
                      : days && parseFloat(days) > 0
                        ? {
                            borderColor: 'var(--ws-green-bdr)',
                            background: 'var(--ws-green-bg)',
                          }
                        : {}
                  }
                />
              </div>

              {/* Reason */}
              <div className="ws-field">
                <label className="ws-label">
                  Reason{' '}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      background: 'var(--ws-red-bg)',
                      color: 'var(--ws-red)',
                      border: '1px solid var(--ws-red-bdr)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      marginLeft: 4,
                      verticalAlign: 'middle',
                    }}
                  >
                    required
                  </span>
                </label>
                <textarea
                  className="ws-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Carry-forward correction, special approval by Director…"
                  rows={3}
                />
              </div>

              {/* Summary strip */}
              {isFormValid && (
                <div
                  style={{
                    background: selectedType.bg,
                    border: `1px solid ${selectedType.bdr}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: selectedType.color,
                    fontWeight: 500,
                  }}
                >
                  {selectedType.icon}
                  {selectedType.label} of{' '}
                  <strong>
                    {Math.abs(parseFloat(days))} day
                    {Math.abs(parseFloat(days)) !== 1 ? 's' : ''}
                  </strong>{' '}
                  will be applied to the selected employee's balance.
                </div>
              )}

              <div className="ws-btn-row">
                <button
                  type="submit"
                  className="ws-btn ws-btn-primary"
                  disabled={!isFormValid || loading}
                  style={{ opacity: !isFormValid || loading ? 0.5 : 1 }}
                >
                  <Scale size={13} />
                  {loading ? 'Processing…' : 'Apply adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Balance Override"
        description={`You are about to manually adjust ${
          employees.find((e) => e.id === selectedEmployee)?.firstName ||
          'the employee'
        }'s ${
          policies.find((p) => p.id === selectedPolicy)?.name || 'leave'
        } balance by ${parseFloat(days) || 0} days. This cannot be automatically reversed.`}
        confirmLabel="Apply Override"
        cancelLabel="Cancel"
        variant="destructive"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={executeOverride}
      />
    </div>
  );
}

export default LeaveBalanceOverridePage;
