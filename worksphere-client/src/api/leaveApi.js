import axiosInstance from './axiosInstance';

// 1. LEAVE POLICIES (HR/Admin setup)

export const getAllLeavePolicies = async () => {
  const response = await axiosInstance.get('/api/leave-policies');
  return response.data;
};

export const createLeavePolicy = async (policyData) => {
  const response = await axiosInstance.post('/api/leave-policies', policyData);
  return response.data;
};

export const updateLeavePolicy = async (policyId, policyData) => {
  const response = await axiosInstance.put(`/api/leave-policies/${policyId}`, policyData);
  return response.data;
};

// 2. LEAVE LEDGER (Balances & History)

export const getMyBalances = async () => {
  const response = await axiosInstance.get('/api/leave/my-balances');
  return response.data;
};

export const getMyLedger = async () => {
  const response = await axiosInstance.get('/api/leave/my-ledger');
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await axiosInstance.get('/api/leave-requests/my-requests');
  return response.data;
};

export const getLeaveBoardRecords = async (scope) => {
  const response = await axiosInstance.get('/api/leave-requests/leave-board', {
    params: scope ? { scope } : {},
  });
  return response.data;
};

// HR Only: Manually add/remove days from a balance
export const adjustBalanceManually = async (adjustmentData) => {
  // adjustmentData needs: { employeeId, policyId, transactionType, days, reason }
  const response = await axiosInstance.post(
    '/api/leave/adjust-balance',
    adjustmentData
  );
  return response.data;
};



// 3. LEAVE REQUESTS (The Approval Flow)

export const submitLeaveRequest = async (requestData) => {
  // requestData needs: { policyId, startDate, endDate, requestedDays, reason }
  const response = await axiosInstance.post(
    '/api/leave-requests/submit',
    requestData
  );
  return response.data;
};

// Manager/HR Only
export const approveLeaveRequest = async (requestId, comment) => {
  const response = await axiosInstance.put(
    `/api/leave-requests/${requestId}/approve`,
    { comment }
  );
  return response.data;
};

// Manager/HR Only
export const rejectLeaveRequest = async (requestId, comment) => {
  const response = await axiosInstance.put(
    `/api/leave-requests/${requestId}/reject`,
    { comment }
  );
  return response.data;
};

// Manager Only: Get all pending requests for their department
export const getPendingLeaveRequests = async () => {
  const response = await axiosInstance.get('/api/leave-requests/pending');
  return response.data;
};

// HR/Admin Only: Get all pending requests company-wide
export const getAllPendingLeaveRequests = async () => {
  const response = await axiosInstance.get('/api/leave-requests/all-pending');
  return response.data;
};
