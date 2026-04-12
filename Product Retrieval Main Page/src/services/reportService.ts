import apiClient from './api';

export interface CreateReportParams {
  reported_user_id?: string;
  product_id?: string;
  report_type: 'user' | 'product';
  category: string;
  reason: string;
  images: File[];
}

export const reportService = {
  createReport: (data: CreateReportParams) => {
    const form = new FormData();
    form.append('report_type', data.report_type);
    form.append('category', data.category);
    form.append('reason', data.reason);
    if (data.product_id) form.append('product_id', data.product_id);
    if (data.reported_user_id) form.append('reported_user_id', data.reported_user_id);
    data.images.forEach((img) => form.append('images', img));
    return apiClient.post('/reports', form, { headers: { 'Content-Type': undefined as any } });
  },

  getMyReports: () => apiClient.get('/reports/my/submitted'),
};
