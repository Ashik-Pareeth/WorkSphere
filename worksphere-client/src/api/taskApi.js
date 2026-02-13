import axiosInstance from './axiosInstance';
const API_URL = 'http://localhost:8080/tasks';

// Get tasks assigned to the logged-in user
export const getMyTasks = async () => {
  const response = await axiosInstance.get('/tasks/my-tasks');
  return response.data;
};

// Get tasks created by the logged-in manager
export const getAssignedByMe = async () => {
  const response = await axiosInstance.get('/tasks/assigned-by-me');
  return response.data;
};

// Create a new task
export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

export const updateTaskStatus = async (taskId, newStatus) => {
  const token = localStorage.getItem('token');
  // Note: We use PATCH for partial updates
  const response = await axiosInstance.patch(
    `${API_URL}/${taskId}/status?status=${newStatus}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
export const getTaskComments = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const addTaskComment = async (taskId, content) => {
  // We send the content as a plain string based on your Spring Boot controller
  const response = await axiosInstance.post(
    `/tasks/${taskId}/comments`,
    content,
    {
      headers: { 'Content-Type': 'text/plain' },
    }
  );
  return response.data;
};
