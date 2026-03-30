import apiClient from './api';

export const dealService = {
  async createDeal(listingID: string, buyerID: string, sellerID: string, finalPrice: number) {
    const res = await apiClient.post('/deals', { listingID, buyerID, sellerID, finalPrice });
    return res.data.data;
  },
  async getMyDeals() {
    const res = await apiClient.get('/deals');
    return res.data.data || [];
  },
  async getDealForProduct(listingID: string) {
    const res = await apiClient.get(`/deals/product/${listingID}`);
    return res.data.data;
  },
  async acceptDeal(dealId: string) {
    const res = await apiClient.put(`/deals/${dealId}/accept`);
    return res.data;
  },
  async rejectDeal(dealId: string) {
    const res = await apiClient.put(`/deals/${dealId}/reject`);
    return res.data;
  },
  async confirmDeal(dealId: string) {
    const res = await apiClient.put(`/deals/${dealId}/confirm`);
    return res.data;
  },
  async cancelDeal(dealId: string) {
    const res = await apiClient.put(`/deals/${dealId}/status`, { status: 'cancelled' });
    return res.data;
  },
  async deleteDeal(dealId: string) {
    const res = await apiClient.delete(`/deals/${dealId}`);
    return res.data;
  },
};
