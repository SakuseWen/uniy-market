import apiClient from './api';
import { compressImages } from '../lib/imageUtils';

export interface CreateReportParams {
  reported_user_id?: string;
  product_id?: string;
  report_type: 'user' | 'product';
  category: string;
  reason: string;
  images: File[];
}

export const reportService = {
  createReport: async (data: CreateReportParams) => {
    // 上传前压缩图片 / Compress images before upload
    const compressedImages = await compressImages(data.images);

    const form = new FormData();
    form.append('report_type', data.report_type);
    form.append('category', data.category);
    form.append('reason', data.reason);
    if (data.product_id) form.append('product_id', data.product_id);
    if (data.reported_user_id) form.append('reported_user_id', data.reported_user_id);
    compressedImages.forEach((img) => form.append('images', img));
    return apiClient.post('/reports', form, { headers: { 'Content-Type': undefined as any } });
  },

  getMyReports: () => apiClient.get('/reports/my/submitted'),
};
