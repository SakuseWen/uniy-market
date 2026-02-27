import apiClient, { PaginatedResponse } from './api';
import { Product } from '../lib/mockData';

// 后端商品类型
interface BackendProduct {
  listingID: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  condition: 'new' | 'used' | 'like_new';
  location?: string;
  categoryID: number;
  sellerID: string;
  status: 'active' | 'sold' | 'inactive';
  views: number;
  createdAt: string;
  updatedAt: string;
  images?: Array<{
    imageID: string;
    imagePath: string;
    isPrimary: boolean;
  }>;
  seller?: {
    userID: string;
    name: string;
    profileImage?: string;
    isVerified: boolean;
  };
  category?: {
    categoryID: number;
    name: string;
  };
}

// 搜索过滤器
export interface ProductFilters {
  q?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  condition?: 'new' | 'used' | 'like_new';
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
  page?: number;
  limit?: number;
}

// 转换后端商品数据到前端格式
function transformProduct(backendProduct: BackendProduct): Product {
  const primaryImage = backendProduct.images?.find(img => img.isPrimary);
  const imageUrl = primaryImage?.imagePath || backendProduct.images?.[0]?.imagePath;

  return {
    id: backendProduct.listingID,
    title: backendProduct.title,
    price: backendProduct.price,
    negotiable: false,
    condition: backendProduct.condition === 'new' ? 'new' : 
               backendProduct.condition === 'like_new' ? 'ninetyNew' : 'eightyNew',
    campus: 'mainCampus' as const,
    category: 'others' as const,
    image: imageUrl || '/placeholder-product.jpg',
    images: backendProduct.images?.map(img => img.imagePath) || [],
    description: backendProduct.description,
    seller: {
      name: backendProduct.seller?.name || 'Unknown',
      avatar: backendProduct.seller?.profileImage || '',
      role: 'student' as const,
      verified: backendProduct.seller?.isVerified || false,
      rating: 4.5,
      totalTrades: 0,
      responseTime: '< 1 hour',
      joinDate: '2024-01-01',
    },
    deliveryType: ['faceToFace'],
    badges: [],
    views: backendProduct.views,
    publishedDate: backendProduct.createdAt,
    distance: '0 km',
    itemLanguage: 'english' as const,
    sold: backendProduct.status === 'sold',
  };
}

// 商品服务
export const productService = {
  // 获取商品列表（带搜索和过滤）
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    
    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category.toString());
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.location) params.append('location', filters.location);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 20).toString());

    const response = await apiClient.get<PaginatedResponse<BackendProduct>>(
      `/products?${params.toString()}`
    );

    return {
      ...response.data,
      products: response.data.products.map(transformProduct),
    };
  },

  // 获取单个商品详情
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<{ success: boolean; data: { product: BackendProduct } }>(
      `/products/${id}`
    );
    return transformProduct(response.data.data.product);
  },

  // 获取分类列表
  async getCategories(): Promise<Array<{ categoryID: number; name: string }>> {
    const response = await apiClient.get<{
      success: boolean;
      data: { categories: Array<{ categoryID: number; name: string }> };
    }>('/products/categories/all');
    return response.data.data.categories;
  },

  // 创建商品
  async createProduct(productData: {
    title: string;
    description?: string;
    price: number;
    stock: number;
    condition: 'new' | 'used' | 'like_new';
    location?: string;
    categoryID: number;
  }): Promise<Product> {
    const response = await apiClient.post<{
      success: boolean;
      data: { product: BackendProduct };
    }>('/products', productData);
    return transformProduct(response.data.data.product);
  },

  // 更新商品
  async updateProduct(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      price: number;
      stock: number;
      condition: 'new' | 'used' | 'like_new';
      location: string;
      categoryID: number;
      status: 'active' | 'sold' | 'inactive';
    }>
  ): Promise<Product> {
    const response = await apiClient.put<{
      success: boolean;
      data: { product: BackendProduct };
    }>(`/products/${id}`, updates);
    return transformProduct(response.data.data.product);
  },

  // 删除商品
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  // 标记为已售出
  async markAsSold(id: string): Promise<Product> {
    const response = await apiClient.post<{
      success: boolean;
      data: { product: BackendProduct };
    }>(`/products/${id}/mark-sold`);
    return transformProduct(response.data.data.product);
  },

  // 上传商品图片
  async uploadImages(productId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    await apiClient.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除商品图片
  async deleteImage(imageId: string): Promise<void> {
    await apiClient.delete(`/products/images/${imageId}`);
  },
};
