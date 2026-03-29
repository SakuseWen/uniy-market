import apiClient from './api';

export const favoriteService = {
  async getFavorites(): Promise<any[]> {
    const res = await apiClient.get('/favorites?includeProducts=true&active=true');
    return res.data.favorites || [];
  },

  async addFavorite(listingID: string): Promise<void> {
    await apiClient.post('/favorites', { listingID });
  },

  async removeFavorite(listingID: string): Promise<void> {
    await apiClient.delete(`/favorites/${listingID}`);
  },

  async checkBatch(listingIDs: string[]): Promise<Record<string, boolean>> {
    if (listingIDs.length === 0) return {};
    const res = await apiClient.post('/favorites/check-batch', { listingIDs });
    return res.data.favorites || {};
  },
};
