import { useState, useEffect } from 'react';
import { fetchMyAssets } from '../../api/hrApi';

const conditionColor = (c) => ({
  NEW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GOOD: 'bg-blue-50 text-blue-700 border-blue-200',
  FAIR: 'bg-amber-50 text-amber-700 border-amber-200',
  DAMAGED: 'bg-red-50 text-red-700 border-red-200',
  RETIRED: 'bg-gray-100 text-gray-500 border-gray-200',
})[c] || 'bg-gray-50 text-gray-600 border-gray-200';

const typeIcon = (t) => ({
  LAPTOP: '💻', MONITOR: '🖥️', KEYBOARD: '⌨️', PHONE: '📱', ACCESS_CARD: '🪪', OTHER: '📦',
})[t] || '📦';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMyAssets();
        setAssets(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your assets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
      Loading Your Assets...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">My Assets</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {assets.length} {assets.length === 1 ? 'item' : 'items'} assigned to you
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">📦</span>
            <h3 className="text-sm font-semibold text-gray-600">No Assets Assigned</h3>
            <p className="text-xs text-gray-400 mt-1">You don't have any company assets assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeIcon(asset.type)}</span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{asset.makeModel}</h3>
                      <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {asset.assetTag}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conditionColor(asset.condition)}`}>
                    {asset.condition}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-gray-700 font-medium">{asset.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Serial</span>
                    <span className="text-gray-700 font-mono">{asset.serialNumber}</span>
                  </div>
                  {asset.assignedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Assigned</span>
                      <span className="text-gray-700">{new Date(asset.assignedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {asset.warrantyExpiry && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Warranty</span>
                      <span className={`font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-500' : 'text-gray-700'}`}>
                        {new Date(asset.warrantyExpiry).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyAssets;
