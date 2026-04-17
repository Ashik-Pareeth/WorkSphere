import axiosInstance from './axiosInstance';

// Fetch all employees (used for the dropdown list)
export const getAllEmployees = async () => {
  const response = await axiosInstance.get('/employees');
  return response.data;
};

// Fetch current user's profile
export const getMyProfile = async () => {
  const response = await axiosInstance.get('/employees/me');
  return response.data;
};

// MANAGER only: fetch direct reports
export const getMyTeam = async () => {
  const response = await axiosInstance.get('/employees/my-team');
  return response.data;
};

// HR/ADMIN only: fetch offboarded/terminated employees
export const getArchivedEmployees = async () => {
  const response = await axiosInstance.get('/employees/archived');
  return response.data;
};
