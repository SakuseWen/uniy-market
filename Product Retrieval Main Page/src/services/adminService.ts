import apiClient from './api';

export const adminService = {
  // Statistics
  getStatistics: () => apiClient.get('/admin/statistics'),

  // Users
  getUsers: (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/users', { params }),
  suspendUser: (userId: string, reason?: string) =>
    apiClient.post(`/admin/users/${userId}/suspend`, { reason }),
  activateUser: (userId: string, reason?: string) =>
    apiClient.post(`/admin/users/${userId}/activate`, { reason }),
  deleteUser: (userId: string, reason?: string) =>
    apiClient.delete(`/admin/users/${userId}`, { data: { reason } }),
  toggleVerify: (userId: string, isVerified: boolean) =>
    apiClient.patch(`/admin/users/${userId}/verify`, { isVerified }),

  // Products
  getProducts: (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/products', { params }),
  removeProduct: (productId: string, reason?: string) =>
    apiClient.post(`/admin/products/${productId}/remove`, { reason }),
  restoreProduct: (productId: string, reason?: string) =>
    apiClient.post(`/admin/products/${productId}/restore`, { reason }),

  // Reports
  getReports: (params?: { status?: string; type?: string; limit?: number; offset?: number }) =>
    apiClient.get('/admin/reports', { params }),
  resolveReport: (reportId: number, notes?: string) =>
    apiClient.post(`/admin/reports/${reportId}/resolve`, { notes }),
  dismissReport: (reportId: number, notes?: string) =>
    apiClient.post(`/admin/reports/${reportId}/dismiss`, { notes }),
};
