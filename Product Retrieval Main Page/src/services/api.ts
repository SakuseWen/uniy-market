import axios, { AxiosInstance, AxiosError } from 'axios';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';

import { API_BASE_URL } from '../lib/config';

/** 获取当前语言偏好 / Get current language preference */
function getCurrentLanguage(): Language {
  const saved = localStorage.getItem('preferredLanguage');
  if (saved === 'zh' || saved === 'th' || saved === 'en') return saved;
  return 'en';
}

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
    const token = sessionStorage.getItem('authToken');
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
      const errCode = (error.response.data as any)?.error?.code;
      // 仅在 token 真正无效时清除，不清除 suspended 用户的 token
      // Only clear token when truly invalid, not for suspended users
      if (errCode === 'INVALID_TOKEN' || errCode === 'NO_TOKEN' || errCode === 'TOKEN_EXPIRED') {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      }
    }
    // 账户被暂停：统一拦截并附加三语提示 / Account suspended: intercept and attach tri-lingual message
    if (error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.error?.code === 'ACCOUNT_INACTIVE') {
        const lang = getCurrentLanguage();
        const msg = translate(lang, 'accountSuspended');
        // 将三语提示附加到 error 上，方便前端直接使用
        (error as any).suspendedMessage = msg;
      }
      // 不能与自己聊天 / Cannot chat with yourself
      const errMsg = data?.error?.message || '';
      if (errMsg.toLowerCase().includes('cannot create a chat with yourself')) {
        const lang = getCurrentLanguage();
        (error as any).friendlyMessage = translate(lang, 'cannotChatSelf');
      }
    }
    // 请求频率限制：附加三语提示 / Rate limited: attach tri-lingual message
    if (error.response?.status === 429) {
      (error as any).rateLimited = true;
      const lang = getCurrentLanguage();
      const msg = translate(lang, 'rateLimited');
      (error as any).rateLimitedMessage = msg;
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
