/**
 * 前端全局配置 — 所有 API 地址和图片 URL 的唯一来源
 * Frontend global config — single source of truth for all API and image URLs
 *
 * 生产环境通过 .env 中的 VITE_API_URL 和 VITE_BACKEND_URL 配置
 * Production uses VITE_API_URL and VITE_BACKEND_URL from .env
 */

/** 后端服务器基础地址（不含 /api）/ Backend server base URL (without /api) */
export const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000';

/** API 基础地址（含 /api）/ API base URL (with /api) */
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || `${BACKEND_URL}/api`;

/** WebSocket 地址 / WebSocket URL */
export const WS_URL = (import.meta as any).env?.VITE_WS_URL || BACKEND_URL;

/**
 * 将后端相对路径转为完整图片 URL
 * Convert backend relative path to full image URL
 *
 * @example getImageUrl('/uploads/products/xxx.jpg') => 'http://localhost:3000/uploads/products/xxx.jpg'
 * @example getImageUrl('https://example.com/img.jpg') => 'https://example.com/img.jpg'
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * 构建 API fetch URL（用于不走 axios 的 fetch 调用）
 * Build API fetch URL (for fetch calls that don't use axios)
 *
 * @example getApiUrl('/auth/login') => 'http://localhost:3000/api/auth/login'
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}
