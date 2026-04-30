import apiClient, { PaginatedResponse } from './api';
import { Product } from '../lib/mockData';
import { getImageUrl } from '../lib/config';

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
  deliveryType?: 'faceToFace' | 'campusLocker' | 'courier';
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
    rating?: number;
    totalTrades?: number;
    createdAt?: string;
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
  const imagePath = primaryImage?.imagePath || backendProduct.images?.[0]?.imagePath;
  
  // Convert image path to full URL for frontend
  let imageUrl = '/placeholder-product.jpg';
  if (imagePath) {
    // If path starts with /, prepend backend URL
    if (imagePath.startsWith('/')) {
      imageUrl = getImageUrl(imagePath);
    } else {
      imageUrl = imagePath;
    }
  }

  // Map backend condition to frontend condition
  const conditionMap: Record<string, Product['condition']> = {
    'new': 'new',
    'like_new': 'ninetyNew',
    'used': 'eightyNew',
  };

  // Map backend category name to frontend category key
  const categoryMap: Record<string, Product['category']> = {
    'Electronics': 'electronics',
    'Books': 'books',
    'Clothing': 'clothing',
    'Furniture': 'dormFurniture',
    'Sports': 'sports',
    'Other': 'others',
    'Transportation': 'transportation',
  };

  const categoryName = backendProduct.category?.name || '';
  const frontendCategory = categoryMap[categoryName] || 'others';

  return {
    id: backendProduct.listingID,
    title: backendProduct.title,
    price: backendProduct.price,
    negotiable: false,
    condition: conditionMap[backendProduct.condition] || 'eightyNew',
    campus: (backendProduct as any).location || 'mainCampus',
    category: frontendCategory,
    image: imageUrl,
    images: backendProduct.images?.map(img => {
      // Also convert image paths to full URLs
      if (img.imagePath.startsWith('/')) {
        return getImageUrl(img.imagePath);
      }
      return img.imagePath;
    }) || [],
    description: backendProduct.description,
    seller: {
      id: backendProduct.seller?.userID || '',
      name: backendProduct.seller?.name || 'Unknown',
      avatar: backendProduct.seller?.profileImage ? getImageUrl(backendProduct.seller.profileImage) : '',
      role: 'student' as const,
      verified: backendProduct.seller?.isVerified || false,
      rating: backendProduct.seller?.rating || 5,
      totalTrades: backendProduct.seller?.totalTrades,
      responseTime: undefined,
      joinDate: backendProduct.seller?.createdAt,
    },
    deliveryType: backendProduct.deliveryType ? [backendProduct.deliveryType] : ['faceToFace'],
    badges: [],
    views: backendProduct.views,
    publishedDate: backendProduct.createdAt,
    sold: backendProduct.status === 'sold',
    latitude: (backendProduct as any).latitude,
    longitude: (backendProduct as any).longitude,
    address: (backendProduct as any).address,
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

  // 获取单个商品详情（用于编辑页面，返回完整数据）
  async getProductByIdForEdit(id: string): Promise<{ 
    product: BackendProduct;
    images: Array<{ imageID: string; imagePath: string; isPrimary: boolean }>;
  }> {
    const response = await apiClient.get<{ 
      success: boolean; 
      data: { 
        product: BackendProduct;
        images?: Array<{ imageID: string; imagePath: string; isPrimary: boolean }>;
        seller?: any;
        category?: any;
      } 
    }>(`/products/${id}`);
    
    return {
      product: response.data.data.product,
      images: response.data.data.images || []
    };
  },

  // 获取单个商品详情
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<{ 
      success: boolean; 
      data: { 
        product: BackendProduct;
        images?: Array<{ imageID: string; imagePath: string; isPrimary: boolean }>;
        seller?: any;
        category?: any;
      } 
    }>(`/products/${id}`);
    
    // Merge images, seller, category into product data
    const productData = response.data.data.product;
    if (response.data.data.images) {
      productData.images = response.data.data.images;
    }
    if (response.data.data.seller) {
      productData.seller = response.data.data.seller;
    }
    if (response.data.data.category) {
      productData.category = response.data.data.category;
    }
    
    return transformProduct(productData);
  },

  // 获取分类列表
  async getCategories(): Promise<Array<{ categoryID: number; name: string; nameEn?: string; nameZh?: string; nameTh?: string }>> {
    const response = await apiClient.get<{
      success: boolean;
      data: { categories: Array<{ categoryID: number; name: string; nameEn?: string; nameZh?: string; nameTh?: string }> };
    }>('/products/categories/all');
    
    const data = response.data.data;
    let categoriesArray: Array<any> = [];
    
    if (Array.isArray(data)) {
      categoriesArray = data;
    } else if (data && Array.isArray(data.categories)) {
      categoriesArray = data.categories;
    }
    
    // Remove duplicates based on name
    const uniqueMap = new Map<string, { categoryID: number; name: string; nameEn?: string; nameZh?: string; nameTh?: string }>();
    
    categoriesArray.forEach(cat => {
      const name = cat.name || '';
      
      if (cat.categoryID > 0 && name && !uniqueMap.has(name)) {
        uniqueMap.set(name, {
          categoryID: cat.categoryID,
          name: name,
          nameEn: cat.nameEn,
          nameZh: cat.nameZh,
          nameTh: cat.nameTh,
        });
      }
    });
    
    return Array.from(uniqueMap.values());
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
    deliveryType?: 'faceToFace' | 'campusLocker' | 'courier';
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
      deliveryType: 'faceToFace' | 'campusLocker' | 'courier';
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

  // 获取用户的商品列表
  async getUserProducts(userId: string, page: number = 1, limit: number = 20, includeInactive: boolean = false): Promise<{ data: BackendProduct[] }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { 
          data: BackendProduct[];
          pagination?: any;
        };
      }>(`/products/seller/${userId}?page=${page}&limit=${limit}${includeInactive ? '&includeInactive=true' : ''}`);
      
      console.log('getUserProducts response:', response.data);
      
      // 处理响应格式 - 后端返回 { data: { data: [...], pagination: {...} } }
      const products = response.data.data?.data || response.data.data || [];
      
      return {
        data: Array.isArray(products) ? products : [],
      };
    } catch (error) {
      console.error('getUserProducts error:', error);
      throw error;
    }
  },

  // 上传商品图片（新方法，支持 FormData）
  async uploadProductImages(productId: string, formData: FormData): Promise<any> {
    const response = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 增加超时时间
    });
    return response.data;
  },

  // 删除商品图片（新方法）
  async deleteProductImage(imageId: string): Promise<void> {
    await apiClient.delete(`/products/images/${imageId}`);
  },
};
