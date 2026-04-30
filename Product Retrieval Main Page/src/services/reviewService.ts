import apiClient from './api';
import { compressImages } from '../lib/imageUtils';

export const reviewService = {
  async submitReview(data: { rating: number; comment: string; targetUserID: string; dealID: string; reviewType: string; images?: File[] }) {
    const res = await apiClient.post('/reviews', {
      rating: data.rating,
      comment: data.comment,
      targetUserID: data.targetUserID,
      dealID: data.dealID,
      reviewType: data.reviewType,
    });
    const reviewID = res.data?.data?.reviewID || res.data?.reviewID;

    // 如果有图片，压缩后上传 / If images provided, compress and upload
    if (reviewID && data.images && data.images.length > 0) {
      const compressed = await compressImages(data.images);
      const form = new FormData();
      compressed.forEach((img) => form.append('images', img));
      await apiClient.post(`/reviews/${reviewID}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return res.data;
  },
  async getUserReviews(userId: string) {
    const res = await apiClient.get(`/reviews/user/${userId}`);
    return res.data.data;
  },
  async getUserRating(userId: string): Promise<{ average: number; count: number }> {
    const res = await apiClient.get(`/reviews/user/${userId}`);
    const stats = res.data.data?.statistics?.overall;
    return { average: stats?.average || 5, count: stats?.count || 0 };
  },
};
