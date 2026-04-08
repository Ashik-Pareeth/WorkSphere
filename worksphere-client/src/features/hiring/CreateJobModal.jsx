import React, { useState, useEffect } from 'react';
import { createJobOpening } from '../../api/hiringApi';
import axiosInstance from '../../api/axiosInstance';
import { Button, Alert } from '@/components/ui/button';
import { X, Briefcase, Building2, Users } from 'lucide-react';

const CreateJobModal = ({ onClose, onJobCreated }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    jobPositionId: '',
    openSlots: 1,
    salaryMin: '',
    salaryMax: '',
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        // Note: these backend endpoints don't have the /api/ prefix
        const [deptRes, posRes] = await Promise.all([
          axiosInstance.get('/departments'),
          axiosInstance.get('/jobPositions'),
        ]);
        setDepartments(deptRes.data || []);
        setJobPositions(posRes.data || []);
      } catch (err) {
        console.error('Failed to load dropdowns', err);
      }
    };
    fetchDropdowns();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        departmentId: formData.departmentId, // FIXED: Flat ID
        jobPositionId: formData.jobPositionId, // FIXED: Flat ID
        openSlots: parseInt(formData.openSlots, 10),
        // (hrOwnerId should be passed if your backend requires it)
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
      };

      await createJobOpening(payload);
      onJobCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create job opening', error);
      Alert('Failed to create job opening. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Create Job Opening
              </h2>
              <p className="text-sm text-gray-500">
                Publish a new position to the public portal.
              </p>
            </div>
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

        <div className="p-6 overflow-y-auto">
          <form
            id="createJobForm"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="inline h-4 w-4 mr-1 text-gray-400" />{' '}
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Position <span className="text-red-500">*</span>
                </label>
                <select
                  name="jobPositionId"
                  required
                  value={formData.jobPositionId}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="" disabled>
                    Select System Position
                  </option>
                  {jobPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.positionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className="inline h-4 w-4 mr-1 text-gray-400" /> Open
                  Slots <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="openSlots"
                  min="1"
                  required
                  value={formData.openSlots}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-xs">
                    Min Salary (Optional)
                  </label>
                  <input
                    type="number"
                    name="salaryMin"
                    placeholder="e.g. 60000"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-xs">
                    Max Salary (Optional)
                  </label>
                  <input
                    type="number"
                    name="salaryMax"
                    placeholder="e.g. 90000"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  placeholder="Write the full job description and requirements here..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 mt-auto">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="createJobForm"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish Job Opening'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
