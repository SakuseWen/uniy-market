// Common types for the Uniy Market application

export interface User {
  userID: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  isVerified: boolean;
  preferredLanguage: 'en' | 'th' | 'zh';
  isAdmin: boolean;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  studentID: string;
  userID: string;
  schoolName: string;
  grade?: string;
  studentEmail: string;
  verificationDate: string;
}

export interface Category {
  catID: number;
  name: string;
  nameEn?: string;
  nameTh?: string;
  nameZh?: string;
  description?: string;
  isActive: boolean;
}

export interface ProductListing {
  listingID: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  condition: 'new' | 'used' | 'like_new';
  location?: string;
  categoryID: number;
  sellerID: string;
  status: 'active' | 'sold' | 'inactive' | 'reported';
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  imageID: string;
  listingID: string;
  imagePath: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface Chat {
  chatID: string;
  buyerID: string;
  sellerID: string;
  listingID: string;
  status: 'active' | 'closed' | 'deleted';
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  messageID: string;
  chatID: string;
  senderID: string;
  messageText: string;
  messageType: 'text' | 'image';
  isTranslated: boolean;
  originalLanguage?: string;
  translatedText?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Review {
  reviewID: string;
  rating: number; // 1-5
  comment?: string;
  reviewerID: string;
  targetUserID: string;
  dealID?: string;
  reviewType: 'buyer_to_seller' | 'seller_to_buyer';
  createdAt: string;
}

export interface Deal {
  dealID: string;
  listingID: string;
  buyerID: string;
  sellerID: string;
  transactionDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  finalPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  reportID: string;
  reporterID: string;
  targetItemID?: string;
  targetUserID?: string;
  reason: 'inappropriate_content' | 'spam' | 'fraud' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Favorite {
  favID: string;
  userID: string;
  listingID: string;
  createdAt: string;
}

export interface SensitiveWords {
  id: number;
  word: string;
  language: string;
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  logID: string;
  adminID: string;
  action: string;
  targetType: 'user' | 'product' | 'report' | 'system';
  targetID?: string;
  details?: string;
  timestamp: string;
}

export interface UserReputation {
  userID: string;
  averageRating: number;
  totalReviews: number;
  completedTransactions: number;
  buyerRating: number;
  sellerRating: number;
}

export interface UniversityWhitelist {
  id: number;
  domain: string;
  universityName: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
  timestamp: string;
}

export interface SearchFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  condition?: 'new' | 'used' | 'like_new';
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
