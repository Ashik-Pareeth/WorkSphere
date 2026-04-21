import React, { useState, useEffect } from 'react';
import { createJobOpening, updateJobOpening } from '../../api/hiringApi';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { X, Briefcase, Building2, Users } from 'lucide-react';

const CreateJobModal = ({ onClose, onJobCreated, editMode = false, initialData = null }) => {
  const { user: _unusedUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    departmentId: initialData?.departmentId || '',
    jobPositionId: initialData?.jobPositionId || '',
    openSlots: initialData?.openSlots || 1,
    salaryMin: initialData?.salaryMin || '',
    salaryMax: initialData?.salaryMax || '',
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
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

  const handleSubmit = async (targetStatus) => {
    if (
      !formData.title ||
      !formData.departmentId ||
      !formData.jobPositionId ||
      !formData.description
    ) {
      alert('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        departmentId: formData.departmentId,
        jobPositionId: formData.jobPositionId,
        openSlots: parseInt(formData.openSlots, 10),
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        status: targetStatus,
      };
      if (editMode && initialData?.id) {
        await updateJobOpening(initialData.id, payload);
      } else {
        await createJobOpening(payload);
      }
      onJobCreated();
      onClose();
    } catch (error) {
      console.error('Failed to save job opening', error);
      alert('Failed to save job opening. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // refined version of your component
  // source: :contentReference[oaicite:0]{index=0}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-[#0f172a] rounded-xl shadow-xl border border-gray-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editMode ? 'Edit Job Opening' : 'Create Job Opening'}
              </h2>
              <p className="text-xs text-gray-400">
                {editMode ? 'Update the details of this role' : 'Add a new role to your hiring pipeline'}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto">
          <form className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Senior Frontend Developer"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  Department *
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Job Position */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Position *
                </label>
                <select
                  name="jobPositionId"
                  value={formData.jobPositionId}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select Position
                  </option>
                  {jobPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.positionName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Open Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  Open Slots *
                </label>
                <input
                  type="number"
                  name="openSlots"
                  min="1"
                  value={formData.openSlots}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Salary */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  name="salaryMin"
                  placeholder="Min Salary"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  name="salaryMax"
                  placeholder="Max Salary"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe responsibilities, requirements, and expectations..."
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900/40">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>

          <Button
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            Save Draft
          </Button>

          <Button
            onClick={() => handleSubmit('OPEN')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
