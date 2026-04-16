import axiosInstance from './axiosInstance';

// ==================== ASSET ENDPOINTS ====================

export const fetchAllAssets = (type) => {
  const params = type ? { type } : {};
  return axiosInstance.get('/api/hr/assets', { params });
};

export const createAsset = (data) => {
  return axiosInstance.post('/api/hr/assets', data);
};

export const assignAsset = (assetId, data) => {
  return axiosInstance.put(`/api/hr/assets/${assetId}/assign`, data);
};

export const returnAsset = (assetId, data) => {
  return axiosInstance.put(`/api/hr/assets/${assetId}/return`, data);
};

export const fetchEmployeeAssets = (employeeId) => {
  return axiosInstance.get(`/api/hr/assets/employee/${employeeId}`);
};

export const fetchMyAssets = () => {
  return axiosInstance.get('/api/hr/assets/my');
};

// ==================== TICKET ENDPOINTS ====================

export const fetchAllTickets = (status) => {
  const params = status ? { status } : {};
  return axiosInstance.get('/api/hr/tickets', { params });
};

export const fetchAllTicketsForAudit = (status) => {
  const params = status ? { status } : {};
  return axiosInstance.get('/api/hr/tickets/all-audit', { params });
};

export const createTicket = (data) => {
  return axiosInstance.post('/api/hr/tickets', data);
};

export const assignTicket = (ticketId, assignToId) => {
  return axiosInstance.put(`/api/hr/tickets/${ticketId}/assign`, {
    assignToId,
  });
};

export const addTicketComment = (ticketId, data) => {
  return axiosInstance.post(`/api/hr/tickets/${ticketId}/comment`, data);
};

export const resolveTicket = (ticketId, resolution) => {
  return axiosInstance.put(`/api/hr/tickets/${ticketId}/resolve`, {
    resolution,
  });
};

export const fetchMyTickets = () => {
  return axiosInstance.get('/api/hr/tickets/my');
};

// ==================== NOTIFICATION ENDPOINTS ====================

export const fetchNotifications = () => {
  return axiosInstance.get('/api/notifications');
};

export const fetchUnreadCount = () => {
  return axiosInstance.get('/api/notifications/unread-count');
};

export const markNotificationRead = (id) => {
  return axiosInstance.put(`/api/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return axiosInstance.put('/api/notifications/read-all');
};

// ==================== APPRAISAL ENDPOINTS ====================

export const fetchAllAppraisals = () => {
  return axiosInstance.get('/api/hr/appraisal');
};

export const fetchMyAppraisals = () => {
  return axiosInstance.get('/api/hr/appraisal/my');
};

export const fetchTeamAppraisals = () => {
  return axiosInstance.get('/api/hr/appraisal/team');
};

export const createAppraisal = (data) => {
  return axiosInstance.post('/api/hr/appraisal', data);
};

export const submitSelfAppraisal = (id, data) => {
  return axiosInstance.put(`/api/hr/appraisal/${id}/self-rating`, data);
};

export const submitManagerAppraisal = (id, data) => {
  return axiosInstance.put(`/api/hr/appraisal/${id}/manager-rating`, data);
};

export const acknowledgeAppraisal = (id) => {
  return axiosInstance.put(`/api/hr/appraisal/${id}/acknowledge`);
};

// ==================== OFFBOARDING ENDPOINTS ====================

export const fetchAllOffboardingRecords = () => {
  return axiosInstance.get('/api/hr/offboarding');
};

export const fetchMyOffboardingRecord = () => {
  return axiosInstance.get('/api/hr/offboarding/my');
};

export const initiateOffboarding = (data) => {
  return axiosInstance.post('/api/hr/offboarding', data);
};

export const updateOffboardingClearance = (id, department, isCleared) => {
  return axiosInstance.put(`/api/hr/offboarding/${id}/clearance`, null, {
    params: { department, isCleared },
  });
};

// ==================== PAYROLL ENDPOINTS ====================

export const generatePayroll = (data) => {
  return axiosInstance.post('/api/hr/payroll/generate', data);
};

export const fetchPayrollSummary = (month, year) => {
  return axiosInstance.get('/api/hr/payroll/summary', {
    params: { month, year },
  });
};

export const fetchEmployeePayroll = (employeeId) => {
  return axiosInstance.get(`/api/hr/payroll/employee/${employeeId}`);
};

export const fetchMyPayroll = () => {
  return axiosInstance.get('/api/hr/payroll/my');
};

export const processPayroll = (id) => {
  return axiosInstance.put(`/api/hr/payroll/${id}/process`);
};

export const markPayrollPaid = (id) => {
  return axiosInstance.put(`/api/hr/payroll/${id}/mark-paid`);
};

export const saveSalaryStructure = (data) => {
  return axiosInstance.post('/api/hr/payroll/salary-structure', data);
};

export const fetchSalaryStructure = (employeeId) => {
  return axiosInstance.get(`/api/hr/payroll/salary-structure/${employeeId}`);
};

export const fetchSalaryStructureTemplate = (jobPositionId) => {
  return axiosInstance.get(
    `/api/hr/payroll/salary-structure-template/${jobPositionId}`
  );
};

export const downloadPayslip = (id) => {
  return axiosInstance.get(`/api/hr/payroll/${id}/payslip`, {
    responseType: 'blob',
  });
};
