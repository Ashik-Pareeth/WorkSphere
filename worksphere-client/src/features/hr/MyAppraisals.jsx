import React, { useState, useEffect } from 'react';
import {
  fetchMyAppraisals,
  submitSelfAppraisal,
  acknowledgeAppraisal,
} from '../../api/hrApi';

const MyAppraisals = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [formData, setFormData] = useState({
    rating: 3,
    comments: '',
  });

  const loadAppraisals = async () => {
    try {
      setLoading(true);
      const res = await fetchMyAppraisals();
      setAppraisals(res.data);
      console.log(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your appraisals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppraisals();
  }, []);

  const handleOpenSelfAppraisal = (appraisal) => {
    setSelectedAppraisal(appraisal);
    setFormData({
      rating: 3,
      comments: '',
    });
  };

  const handleSelfAppraisalSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitSelfAppraisal(selectedAppraisal.id, formData);
      setSelectedAppraisal(null);
      loadAppraisals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit self evaluation');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAppraisal(id);
      loadAppraisals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge appraisal');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800',
      REVIEWED: 'bg-purple-100 text-purple-800',
      ACKNOWLEDGED: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading Your Appraisals...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appraisals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your performance evaluations and submit self-appraisals.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appraisals.length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            You don't have any performance appraisals yet.
          </div>
        ) : (
          appraisals.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {app.cycleType} Review
                  </h3>
                  <p className="text-xs text-gray-500">
                    {app.reviewPeriodStart} - {app.reviewPeriodEnd}
                  </p>
                </div>
                {statusBadge(app.status)}
              </div>

              <div className="flex-1 space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Metrics</p>
                  <p className="text-sm font-medium text-gray-800">
                    Tasks Completed: {app.tasksCompletedInPeriod}
                  </p>
                  <p className="text-sm font-medium text-red-600">
                    Tasks Overdue: {app.tasksOverdueInPeriod}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    Avg Task Score:{' '}
                    {app.averageTaskScore
                      ? app.averageTaskScore.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>

                {app.status === 'REVIEWED' || app.status === 'ACKNOWLEDGED' ? (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Manager Rating</p>
                      <p className="font-semibold text-gray-900">
                        {app.managerRating} / 5
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Manager Comments</p>
                      <p className="text-sm text-gray-700 italic">
                        "{app.managerComments}"
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Final Score</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {app.finalScore ? app.finalScore.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                {app.status === 'PENDING' && (
                  <button
                    onClick={() => handleOpenSelfAppraisal(app)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Submit Self-Evaluation
                  </button>
                )}

                {app.status === 'IN_REVIEW' && (
                  <p className="text-sm text-gray-500 text-center">
                    Awaiting manager review.
                  </p>
                )}

                {app.status === 'REVIEWED' && (
                  <button
                    onClick={() => handleAcknowledge(app.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex justify-center items-center space-x-2 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>Acknowledge Profile</span>
                  </button>
                )}

                {app.status === 'ACKNOWLEDGED' && (
                  <p className="text-sm text-green-600 font-medium text-center flex items-center justify-center space-x-1">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>Acknowledged</span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAppraisal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Self-Evaluation
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedAppraisal.cycleType} Performance (
              {selectedAppraisal.reviewPeriodStart} to{' '}
              {selectedAppraisal.reviewPeriodEnd})
            </p>
            <form onSubmit={handleSelfAppraisalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Self Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Self Comments
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Highlight your achievements and challenges during this period..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedAppraisal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppraisals;
