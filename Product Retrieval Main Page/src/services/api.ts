import axios, { AxiosInstance, AxiosError } from 'axios';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 支持 cookies
});

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // 可以在这里触发重定向到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  products: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default apiClient;
