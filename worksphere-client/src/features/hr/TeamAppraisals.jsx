import React, { useState, useEffect } from 'react';
import { fetchTeamAppraisals, submitManagerAppraisal } from '../../api/hrApi';
import { toast } from 'sonner';

const TeamAppraisals = () => {
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
      const res = await fetchTeamAppraisals();
      setAppraisals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team appraisals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppraisals();
  }, []);

  const handleOpenReview = (appraisal) => {
    setSelectedAppraisal(appraisal);
    setFormData({
      rating: appraisal.managerRating || 3,
      comments: appraisal.managerComments || '',
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitManagerAppraisal(selectedAppraisal.id, formData);
      setSelectedAppraisal(null);
      loadAppraisals();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to submit manager review'
      );
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

  if (loading) return <div className="p-6">Loading Team Appraisals...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Appraisals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and rate your team's performance.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Employee
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Period
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Tasks Evaluated
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appraisals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    No appraisals for your team at the moment.
                  </td>
                </tr>
              ) : (
                appraisals.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      {app.employeeName}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {app.reviewPeriodStart} to {app.reviewPeriodEnd}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {app.tasksCompletedInPeriod} completed (
                      {app.tasksOverdueInPeriod} overdue)
                    </td>
                    <td className="p-4">{statusBadge(app.status)}</td>
                    <td className="p-4">
                      {app.status === 'IN_REVIEW' && (
                        <button
                          onClick={() => handleOpenReview(app)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Review & Rate
                        </button>
                      )}
                      {app.status === 'REVIEWED' && (
                        <span className="text-gray-500 text-sm">Reviewed</span>
                      )}
                      {app.status === 'PENDING' && (
                        <span className="text-gray-500 text-sm">
                          Awaiting Employee
                        </span>
                      )}
                      {app.status === 'ACKNOWLEDGED' && (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ Acknowledged
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAppraisal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Manager Review
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Evaluating {selectedAppraisal.employeeName}
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <p className="font-medium text-gray-700 mb-1">
                Employee Self-Evaluation:
              </p>
              <p className="text-gray-600 mb-2">
                Rating: {selectedAppraisal.selfRating} / 5
              </p>
              <p className="text-gray-600 italic">
                "{selectedAppraisal.selfComments || 'No comments provided.'}"
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Rating (1-5)
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
                  className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Comments
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Provide feedback on the employee's performance..."
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
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAppraisals;
