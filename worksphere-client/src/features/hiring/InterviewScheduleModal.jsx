import React, { useState, useEffect } from 'react';
import { scheduleInterview } from '../../api/hiringApi';
import axiosInstance from '../../api/axiosInstance';
import { Button } from '@/components/ui/button';
import { X, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

const InterviewScheduleModal = ({ candidate, onClose, onScheduled }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    candidateId: candidate?.id,
    interviewerId: '',
    roundNumber: 1,
    scheduledAt: '',
    mode: 'VIDEO', // IN_PERSON, VIDEO, PHONE
  });

  useEffect(() => {
    axiosInstance
      .get('/employees')
      .then((res) => {
        const interviewers = res.data.filter((emp) =>
          emp.roles?.some((role) =>
            ['HR', 'MANAGER', 'ADMIN'].includes(role.roleName)
          )
        );

        setEmployees(interviewers);

        console.log('Filtered interviewers:', interviewers);
      })
      .catch((err) => console.error('Could not fetch interviewers', err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        candidate: { id: formData.candidateId },
        interviewer: { id: formData.interviewerId },
        roundNumber: parseInt(formData.roundNumber),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        mode: formData.mode,
        status: 'SCHEDULED',
      };
      await scheduleInterview(payload);
      onScheduled(); // Refresh candidate/pipeline
      onClose();
    } catch (error) {
      console.error('Failed to schedule interview', error);
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Schedule Interview
            </h2>
            <p className="text-sm text-gray-500">For {candidate.fullName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className="inline h-4 w-4 mr-1 text-gray-400" />{' '}
                  Interviewer
                </label>
                <select
                  name="interviewerId"
                  required
                  value={formData.interviewerId}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Select an Interviewer...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} -{' '}
                      {emp.departmentName ? emp.departmentName : 'No Dept'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Round Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="roundNumber"
                    required
                    value={formData.roundNumber}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interview Mode
                  </label>
                  <select
                    name="mode"
                    required
                    value={formData.mode}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="IN_PERSON">In-Person</option>
                    <option value="PHONE">Phone Screen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <CalendarIcon className="inline h-4 w-4 mr-1 text-gray-400" />{' '}
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;
