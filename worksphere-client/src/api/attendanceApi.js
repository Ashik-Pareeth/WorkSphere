import axiosInstance from './axiosInstance';

export const clockIn = async () => {
  const response = await axiosInstance.post('/attendance/clock-in');
  return response.data;
};

export const clockOut = async () => {
  const response = await axiosInstance.post('/attendance/clock-out');
  return response.data;
};

export const getAttendanceHistory = async () => {
  const response = await axiosInstance.get('/attendance');
  return response.data;
};

// Manager/HR Only: Fix a missed punch
export const updateTimesheetManually = async (attendanceId, updateData) => {
  // updateData needs: { newClockIn, newClockOut, reason }
  const response = await axiosInstance.put(
    `/attendance/${attendanceId}/manual-update`,
    updateData
  );
  return response.data;
};

// Manager/HR Only: View the history of edits on a specific day
export const getTimesheetAuditLogs = async (attendanceId) => {
  const response = await axiosInstance.get(
    `/attendance/${attendanceId}/audit-logs`
  );
  return response.data;
};

// Manager Only: Get today's roster for their department
export const getDailyRoster = async () => {
  const response = await axiosInstance.get('/attendance/roster/today');
  return response.data;
};

// HR Admin Only: Get today's roster globally
export const getGlobalDailyRoster = async () => {
  const response = await axiosInstance.get('/attendance/roster/global-today');
  return response.data;
};

// HR / Manager / Super Admin: Get full attendance history for a specific employee
export const getAttendanceForEmployee = async (employeeId) => {
  const response = await axiosInstance.get(`/attendance/employee/${employeeId}`);
  return response.data;
};
