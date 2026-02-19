import axiosInstance from './axiosInstance';

// --- READ OPERATIONS ---

// Get tasks assigned TO the logged-in user
export const getMyTasks = async () => {
  const response = await axiosInstance.get('/tasks/my-tasks');
  return response.data;
};

// Manager: Get tasks for the whole department
export const getTeamTasks = async () => {
  // FIX: Updated endpoint to match TaskController
  const response = await axiosInstance.get('/tasks/team-tasks');
  return response.data;
};

// --- WRITE OPERATIONS ---

// Create a new task
export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

// Update status (Start, Submit, Approve, Reject)
export const updateTaskStatus = async (
  taskId,
  status,
  comment = '',
  actualHours = null
) => {
  const payload = {
    status: status,
    comment: comment,
    actualHours: actualHours,
  };

  const response = await axiosInstance.patch(
    `/tasks/${taskId}/status`,
    payload
  );
  return response.data;
};

// --- COMMENTS ---

export const getTaskComments = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const addTaskComment = async (taskId, content) => {
  // FIX: Backend expects JSON { "content": "..." }, not plain text
  const response = await axiosInstance.post(`/tasks/${taskId}/comments`, {
    content,
  });
  return response.data;
};

// --- EVIDENCE (FILES) ---

export const uploadTaskEvidence = async (taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post(
    `/tasks/${taskId}/evidence`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

// FIX: Added missing function called by TaskDetailsModal
export const getTaskEvidence = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}/evidence`);
  return response.data;
};

// --- MANAGER ACTIONS ---

export const rateTask = async (taskId, rating) => {
  const response = await axiosInstance.post(`/tasks/${taskId}/rate`, {
    rating,
  });
  return response.data;
};

export const flagTask = async (taskId, reason) => {
  // Auditor flag is simple text or JSON depending on impl, sticking to simple body
  const response = await axiosInstance.post(`/tasks/${taskId}/flag`, reason, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return response.data;
};
