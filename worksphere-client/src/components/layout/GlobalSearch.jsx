import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllEmployees } from '../../api/employeeApi';
import { fetchAllJobOpenings } from '../../api/hiringApi';
import { getMyTasks } from '../../api/taskApi';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import { Search, Briefcase, CheckSquare, Users } from 'lucide-react';

export default function GlobalSearch({ open, setOpen }) {
  const navigate = useNavigate();
  const { isHR, isGlobalAdmin } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const hasOversight = isHR || isGlobalAdmin;

  useEffect(() => {
    // Only fetch once when the modal opens for the first time
    if (open && !hasFetched) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // 1. Define promises
          const taskPromise = getMyTasks();
          const empPromise = hasOversight
            ? getAllEmployees()
            : Promise.resolve([]);

          // 2. Extract .data locally here so we don't break other components!
          const jobPromise = hasOversight
            ? fetchAllJobOpenings().then((res) => res.data)
            : Promise.resolve([]);

          // 3. Use allSettled to prevent one failed endpoint from crashing the others
          const [taskRes, empRes, jobRes] = await Promise.allSettled([
            taskPromise,
            empPromise,
            jobPromise,
          ]);

          // 4. Safely apply the results
          setTasks(taskRes.status === 'fulfilled' ? taskRes.value : []);

          if (hasOversight) {
            setEmployees(empRes.status === 'fulfilled' ? empRes.value : []);
            setJobs(jobRes.status === 'fulfilled' ? jobRes.value : []);
          }

          setHasFetched(true);
        } catch (error) {
          console.error('Failed to load search index', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [open, hasFetched, hasOversight]);

  const handleSelect = (route) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-400 px-3 py-1.5 rounded-lg cursor-pointer transition-colors w-64 border border-transparent hover:border-gray-300"
      >
        <Search className="w-4 h-4 text-gray-500" />
        <span className="text-sm flex-1 text-left text-gray-500">
          Search...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 font-mono text-[10px] font-medium text-gray-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={
            loading ? 'Loading index...' : 'Type a command or search...'
          }
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {tasks.map((task) => (
                <CommandItem
                  key={`task-${task.id}`}
                  onSelect={() => handleSelect(`/tasks?open=${task.id}`)}
                >
                  <CheckSquare className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{task.title}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {task.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {hasOversight && employees.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Employees">
                {employees.map((emp) => (
                  <CommandItem
                    key={`emp-${emp.id}`}
                    onSelect={() =>
                      handleSelect(`/employee-list?highlight=${emp.id}`)
                    }
                  >
                    <Users className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {emp.jobTitle?.title || 'No Title'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {hasOversight && jobs.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Job Openings">
                {jobs.map((job) => (
                  <CommandItem
                    key={`job-${job.id}`}
                    onSelect={() =>
                      handleSelect(`/hiring/jobs/${job.id}/pipeline`)
                    }
                  >
                    <Briefcase className="mr-2 h-4 w-4 text-purple-500" />
                    <span>{job.title}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {job.department?.name || 'No Dept'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
