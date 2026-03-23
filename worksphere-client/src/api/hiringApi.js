import axiosInstance from './axiosInstance';
import axios from 'axios';

// ==================== JOB OPENINGS ENDPOINTS ====================

export const fetchAllJobOpenings = () => {
  return axiosInstance.get('/api/jobs');
};

export const fetchHiringStats = () => {
  return axiosInstance.get('/api/jobs/stats');
};

export const fetchPublicJobOpenings = () => {
  return axios.get('http://localhost:8080/api/jobs/public');
};

export const fetchPublicJobDetails = (id) => {
  return axios.get(`http://localhost:8080/api/jobs/public/${id}`);
};

export const createJobOpening = (data) => {
  return axiosInstance.post('/api/jobs', data);
};

export const updateJobStatus = (id, status) => {
  return axiosInstance.put(`/api/jobs/${id}/status`, null, {
    params: { status },
  });
};

export const fetchJobById = (id) => {
  return axiosInstance.get(`/api/jobs/${id}`);
};

export const updateJobSlots = (id, slots) => {
  return axiosInstance.put(`/api/jobs/${id}/slots`, null, {
    params: { slots },
  });
};

// ==================== CANDIDATE ENDPOINTS ====================

export const fetchCandidatesByJob = (jobId) => {
  return axiosInstance.get(`/api/candidates/job/${jobId}`);
};

export const applyForJob = (data, file) => {
  const formData = new FormData();

  // Spring Boot @RequestPart requires the JSON string to be clearly identified as application/json
  formData.append(
    'request',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  );

  if (file) {
    formData.append('file', file);
  }

  return axios.post(
    'http://localhost:8080/api/candidates/public/apply',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
};

export const getCandidateResumeUrl = (id) =>
  `${axiosInstance.defaults.baseURL}/api/candidates/${id}/resume`;

export const downloadCandidateResume = (id) =>
  axiosInstance.get(`/api/candidates/${id}/resume`, { responseType: 'blob' });

export const updateCandidateStatus = (id, status, rejectionReason) => {
  return axiosInstance.patch(`/api/candidates/${id}/status`, null, {
    params: { status, rejectionReason },
  });
};

// ==================== INTERVIEW ENDPOINTS ====================

export const fetchInterviewsForCandidate = (candidateId) => {
  return axiosInstance.get(`/api/interviews/candidate/${candidateId}`);
};

export const scheduleInterview = (data) => {
  return axiosInstance.post('/api/interviews', data);
};

export const submitInterviewFeedback = (id, score, feedback) => {
  return axiosInstance.patch(`/api/interviews/${id}/feedback`, feedback, {
    headers: { 'Content-Type': 'text/plain' },
    params: { score },
  });
};

// ==================== OFFER ENDPOINTS ====================

export const fetchOffer = (id) => {
  return axiosInstance.get(`/api/offers/${id}`);
};

export const fetchPublicOffer = (id, token) => {
  return axiosInstance.get(`/api/offers/public/${id}`, {
    params: { token },
  });
};

export const generateOffer = (data) => {
  return axiosInstance.post('/api/offers', data);
};

export const respondToOffer = (id, accept, token) => {
  return axiosInstance.patch(`/api/offers/${id}/respond`, null, {
    params: { accept, token },
  });
};
