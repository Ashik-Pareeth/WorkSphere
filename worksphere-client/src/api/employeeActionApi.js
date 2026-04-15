import axiosInstance from './axiosInstance';

// HR / SUPER_ADMIN: apply a direct action
export const applyEmployeeAction = (data) =>
  axiosInstance.post('/api/employee-actions', data);

// MANAGER: submit a report/suggestion
export const submitManagerReport = (data) =>
  axiosInstance.post('/api/employee-actions/report', data);

// HR / SUPER_ADMIN: get all pending manager reports
export const getPendingReports = () =>
  axiosInstance.get('/api/employee-actions/pending-reports');

// AUDITOR / HR / SUPER_ADMIN: get all action records (read-only audit trail)
export const getAllActionRecords = () =>
  axiosInstance.get('/api/employee-actions/all-records');

// HR / SUPER_ADMIN: approve or reject a manager report
export const reviewReport = (id, approve, reviewNotes) =>
  axiosInstance.patch(`/api/employee-actions/${id}/review`, {
    approve,
    reviewNotes,
  });

// Get full action history for an employee
export const getEmployeeActionHistory = (employeeId) =>
  axiosInstance.get(`/api/employee-actions/employee/${employeeId}`);

// MANAGER: get their own submitted reports
export const getMyReports = () =>
  axiosInstance.get('/api/employee-actions/my-reports');
