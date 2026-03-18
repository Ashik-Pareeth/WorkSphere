import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Make sure to import Input
import { fetchAllJobOpenings, updateJobSlots } from '../../api/hiringApi'; // Import new API function
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Plus, Edit2 } from 'lucide-react'; // Added Edit2 icon
import CreateJobModal from './CreateJobModal';

const JobOpeningsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // States for inline slot editing
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

  // Handler for saving the manual slot update
  const handleUpdateSlots = async (jobId) => {
    try {
      await updateJobSlots(jobId, parseInt(newSlotsVal));
      setEditingJobId(null);
      loadJobs(); // Refresh the list to reflect status/slot changes
    } catch (error) {
      console.error('Failed to update open slots', error);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-blue-500" /> Hiring Pipeline
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsCreatingJob(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Job Opening
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-400" />
            <p>No job openings found. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((jobStats) => {
            const job = jobStats.jobOpening;
            return (
              <Card
                key={job.id}
                className="bg-white dark:bg-gray-800 border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {job.title}
                    </CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'OPEN'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* --- UPDATED SLOT DISPLAY/EDITING SECTION --- */}
                  {editingJobId === job.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        className="h-7 w-20 text-sm"
                        value={newSlotsVal}
                        onChange={(e) => setNewSlotsVal(e.target.value)}
                        min="0"
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleUpdateSlots(job.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => setEditingJobId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      {job.department?.name || 'No Dept'} • {job.openSlots}{' '}
                      Openings
                      <button
                        onClick={() => {
                          setEditingJobId(job.id);
                          setNewSlotsVal(job.openSlots);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Open Slots"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  )}
                  {/* -------------------------------------------- */}
                </CardHeader>
                <CardContent className="pt-4 flex justify-between items-center">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {jobStats.candidateCount}
                      </span>{' '}
                      Candidates
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {jobStats.interviewCount}
                      </span>{' '}
                      Interviews
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/hiring/jobs/${job.id}/pipeline`)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    View Pipeline
                  </Button>
                </CardContent>
              </Card>
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
