import axiosInstance from './axiosInstance';

/**
 * Fetch system audit logs.
 *
 * @param {Object} filters Options: { entityType, entityId, action, performedBy }
 */
export const fetchAuditLogs = (filters = {}) => {
  return axiosInstance.get('/api/audit-logs', { params: filters });
};
