import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAllJobOpenings, updateJobSlots } from '../../api/hiringApi';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Plus, Edit2 } from 'lucide-react';
import CreateJobModal from './CreateJobModal';

const JobOpeningsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const [editingJobId, setEditingJobId] = useState(null);
  const [newSlotsVal, setNewSlotsVal] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetchAllJobOpenings();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to load jobs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlots = async (jobId) => {
    try {
      await updateJobSlots(jobId, parseInt(newSlotsVal));
      setEditingJobId(null);
      loadJobs();
    } catch (error) {
      console.error('Failed to update open slots', error);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-gray-400">Loading jobs...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-500" /> Hiring Pipeline
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          onClick={() => setIsCreatingJob(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Job Opening
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-gray-200 bg-white text-gray-400">
          <Users className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm">No job openings found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((jobStats) => {
            const job = jobStats.jobOpening;
            return (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Card Header */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 leading-snug pr-2">
                      {job.title}
                    </h2>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'OPEN'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Slot display / editing */}
                  {editingJobId === job.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        className="h-7 w-20 text-sm border-gray-300"
                        value={newSlotsVal}
                        onChange={(e) => setNewSlotsVal(e.target.value)}
                        min="0"
                      />
                      <button
                        onClick={() => handleUpdateSlots(job.id)}
                        className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingJobId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>{job.department?.name || 'No Department'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{job.openSlots} opening{job.openSlots !== 1 ? 's' : ''}</span>
                      <button
                        onClick={() => {
                          setEditingJobId(job.id);
                          setNewSlotsVal(job.openSlots);
                        }}
                        className="ml-0.5 text-gray-300 hover:text-blue-500 transition-colors"
                        title="Edit open slots"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3.5 flex justify-between items-center bg-gray-50/60">
                  <div className="flex gap-4">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {jobStats.candidateCount}
                      </span>{' '}
                      Candidates
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {jobStats.interviewCount}
                      </span>{' '}
                      Interviews
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/hiring/jobs/${job.id}/pipeline`)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Pipeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCreatingJob && (
        <CreateJobModal
          onClose={() => setIsCreatingJob(false)}
          onJobCreated={loadJobs}
        />
      )}
    </div>
  );
};

export default JobOpeningsList;