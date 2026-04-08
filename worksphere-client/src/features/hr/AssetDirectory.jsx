import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllAssets,
  createAsset,
  assignAsset,
  returnAsset,
} from '../../api/hrApi';
import { getAllEmployees } from '../../api/employeeApi';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ASSET_TYPES = [
  'LAPTOP',
  'MONITOR',
  'KEYBOARD',
  'PHONE',
  'ACCESS_CARD',
  'OTHER',
];
const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED', 'RETIRED'];

const conditionColor = (c) =>
  ({
    NEW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    GOOD: 'bg-blue-50 text-blue-700 border-blue-200',
    FAIR: 'bg-amber-50 text-amber-700 border-amber-200',
    DAMAGED: 'bg-red-50 text-red-700 border-red-200',
    RETIRED: 'bg-gray-100 text-gray-500 border-gray-200',
  })[c] || 'bg-gray-50 text-gray-600 border-gray-200';

const typeIcon = (t) =>
  ({
    LAPTOP: '💻',
    MONITOR: '🖥️',
    KEYBOARD: '⌨️',
    PHONE: '📱',
    ACCESS_CARD: '🪪',
    OTHER: '📦',
  })[t] || '📦';

const AssetDirectory = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(null);

  const [newAsset, setNewAsset] = useState({
    type: 'LAPTOP',
    makeModel: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    condition: 'NEW',
    notes: '',
  });
  const [assignData, setAssignData] = useState({ employeeId: '', notes: '' });
  const [returnData, setReturnData] = useState({
    condition: 'GOOD',
    notes: '',
  });

  // --- Confirm Dialog State ---
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'default',
    action: null,
  });

  const closeConfirm = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const type = filterType !== 'ALL' ? filterType : undefined;
      const res = await fetchAllAssets(type);
      setAssets(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load assets'
      );
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  useEffect(() => {
    loadAssets();
    loadEmployees();
  }, [loadAssets]);

  // --- INTERCEPTOR: Create Asset ---
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setConfirmConfig({
      isOpen: true,
      title: 'Register Asset?',
      description: `Are you sure you want to register this ${newAsset.type.replace('_', ' ')} (${newAsset.makeModel}) into the system?`,
      variant: 'default',
      confirmLabel: 'Register Asset',
      action: async () => {
        try {
          await createAsset(newAsset);
          setShowAddModal(false);
          setNewAsset({
            type: 'LAPTOP',
            makeModel: '',
            serialNumber: '',
            purchaseDate: '',
            warrantyExpiry: '',
            condition: 'NEW',
            notes: '',
          });
          loadAssets();
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Failed to create asset'
          );
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // --- INTERCEPTOR: Assign Asset ---
  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === assignData.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'this employee';
    const asset = assets.find((a) => a.id === showAssignModal);
    const assetName = asset ? asset.makeModel : 'this asset';

    setConfirmConfig({
      isOpen: true,
      title: 'Assign Asset?',
      description: `Are you sure you want to officially assign the ${assetName} to ${empName}? This will notify the employee.`,
      variant: 'default',
      confirmLabel: 'Yes, Assign',
      action: async () => {
        try {
          await assignAsset(showAssignModal, assignData);
          setShowAssignModal(null);
          setAssignData({ employeeId: '', notes: '' });
          loadAssets();
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Failed to assign asset'
          );
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // --- INTERCEPTOR: Return Asset ---
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === showReturnModal);
    const assetName = asset ? asset.makeModel : 'this asset';
    const isDestructive =
      returnData.condition === 'DAMAGED' || returnData.condition === 'RETIRED';

    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Asset Return?',
      description: `You are returning ${assetName} and marking its condition as ${returnData.condition}.${isDestructive ? ' Marking an asset as DAMAGED or RETIRED may require further IT auditing.' : ''}`,
      variant: isDestructive ? 'destructive' : 'default',
      confirmLabel: 'Confirm Return',
      action: async () => {
        try {
          await returnAsset(showReturnModal, returnData);
          setShowReturnModal(null);
          setReturnData({ condition: 'GOOD', notes: '' });
          loadAssets();
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Failed to return asset'
          );
        } finally {
          closeConfirm();
        }
      },
    });
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
        Loading Asset Registry...
      </div>
    );

  const assigned = assets.filter((a) => a.assignedEmployeeId);
  const unassigned = assets.filter((a) => !a.assignedEmployeeId);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Asset Directory
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {assets.length} assets registered · {assigned.length} assigned ·{' '}
              {unassigned.length} available
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              + Add Asset
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 pl-4 font-semibold text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">
                  Make / Model
                </th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">
                  Serial
                </th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">
                  Warranty
                </th>
                <th className="pb-3 pr-4 font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                >
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{typeIcon(asset.type)}</span>
                      <div>
                        <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {asset.assetTag}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {asset.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-medium text-gray-800">
                    {asset.makeModel}
                  </td>
                  <td className="py-3 font-mono text-gray-500">
                    {asset.serialNumber}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conditionColor(asset.condition)}`}
                    >
                      {asset.condition}
                    </span>
                  </td>
                  <td className="py-3">
                    {asset.assignedEmployeeName ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(asset.assignedEmployeeName)}&background=eff6ff&color=2563eb&size=20`}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-medium text-gray-700">
                          {asset.assignedEmployeeName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3">
                    {asset.warrantyExpiry ? (
                      <span
                        className={`text-[10px] font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        {new Date(asset.warrantyExpiry).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      {!asset.assignedEmployeeId ? (
                        <button
                          onClick={() => setShowAssignModal(asset.id)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          Assign
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowReturnModal(asset.id)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              No assets found.
            </div>
          )}
        </div>
      </main>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Register New Asset
            </h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={newAsset.type}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, type: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Condition
                  </label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, condition: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Make / Model *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.makeModel}
                  onChange={(e) =>
                    setNewAsset((p) => ({ ...p, makeModel: e.target.value }))
                  }
                  placeholder="e.g. Dell XPS 15 9500"
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.serialNumber}
                  onChange={(e) =>
                    setNewAsset((p) => ({ ...p, serialNumber: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) =>
                      setNewAsset((p) => ({
                        ...p,
                        purchaseDate: e.target.value,
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    value={newAsset.warrantyExpiry}
                    onChange={(e) =>
                      setNewAsset((p) => ({
                        ...p,
                        warrantyExpiry: e.target.value,
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={newAsset.notes}
                  onChange={(e) =>
                    setNewAsset((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40"
          onClick={() => setShowAssignModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Assign Asset
            </h2>
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Employee *
                </label>
                <select
                  required
                  value={assignData.employeeId}
                  onChange={(e) =>
                    setAssignData((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>
                    Select employee
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}{' '}
                      {emp.department?.name ? `(${emp.department.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={assignData.notes}
                  onChange={(e) =>
                    setAssignData((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="flex-1 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40"
          onClick={() => setShowReturnModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Return Asset
            </h2>
            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Condition on Return *
                </label>
                <select
                  value={returnData.condition}
                  onChange={(e) =>
                    setReturnData((p) => ({ ...p, condition: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={returnData.notes}
                  onChange={(e) =>
                    setReturnData((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(null)}
                  className="flex-1 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.action}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default AssetDirectory;
