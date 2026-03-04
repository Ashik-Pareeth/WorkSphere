import axiosInstance from './axiosInstance';

// Get all holidays for a year (defaults to current year)
export const getHolidays = async (year) => {
  const params = year ? { year } : {};
  const response = await axiosInstance.get('/api/holidays', { params });
  return response.data;
};

// HR/Admin: Create a new public holiday
export const createHoliday = async (holidayData) => {
  const response = await axiosInstance.post('/api/holidays', holidayData);
  return response.data;
};

// HR/Admin: Delete a public holiday
export const deleteHoliday = async (id) => {
  const response = await axiosInstance.delete(`/api/holidays/${id}`);
  return response.data;
};
