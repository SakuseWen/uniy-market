import apiClient from './api';

export const reviewService = {
  async submitReview(data: { rating: number; comment: string; targetUserID: string; dealID: string; reviewType: string }) {
    const res = await apiClient.post('/reviews', data);
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
