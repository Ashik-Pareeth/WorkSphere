import axiosInstance from './axiosInstance';

// Get all work schedules
export const getAllWorkSchedules = async () => {
  const response = await axiosInstance.get('/api/work-schedules');
  return response.data;
};

// HR/Admin: Create a new schedule
export const createWorkSchedule = async (scheduleData) => {
  const response = await axiosInstance.post(
    '/api/work-schedules',
    scheduleData
  );
  return response.data;
};

// HR/Admin: Update an existing schedule
export const updateWorkSchedule = async (id, scheduleData) => {
  const response = await axiosInstance.put(
    `/api/work-schedules/${id}`,
    scheduleData
  );
  return response.data;
};
