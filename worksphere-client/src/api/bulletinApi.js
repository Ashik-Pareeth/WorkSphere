import axiosInstance from './axiosInstance';

export const getAnnouncements = (page = 0) =>
  axiosInstance.get(`/bulletin/feed?page=${page}&size=50`);

export const postAnnouncement = (content, pinned = false) =>
  axiosInstance.post('/bulletin/announce', { content, pinned });

export const postChat = (content) =>
  axiosInstance.post('/bulletin/chat', { content });

export const setAnonymous = (enabled) =>
  axiosInstance.patch(`/bulletin/me/anonymous?enabled=${enabled}`);

export const togglePinRequest = (id, pinned) =>
  axiosInstance.patch(`/bulletin/${id}/pin?pinned=${pinned}`);

export const getTeamFeed = (page = 0) =>
  axiosInstance.get(`/team/messages?page=${page}&size=50`);

export const postTeamMessage = (content) =>
  axiosInstance.post('/team/messages', { content });
