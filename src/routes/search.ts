/**
 * Search Route — 专用搜索 API（Meilisearch 驱动，SQL 回退）
 * Dedicated search API powered by Meilisearch with SQL fallback
 *
 * GET /api/search?q=关键词&category=1&minPrice=0&maxPrice=100&condition=used&sortBy=price_asc&page=1&limit=20
 */
import express from 'express';
import { query, validationResult } from 'express-validator';
import { meilisearchService, MeiliProduct } from '../services/MeilisearchService';
import { ProductModel } from '../models/ProductModel';
import { UserModel } from '../models/UserModel';
import { ReviewModel } from '../models/ReviewModel';

const router = express.Router();

// 懒加载 Model 实例 / Lazy-load model instances
let productModel: ProductModel | null = null;
let userModel: UserModel | null = null;
let reviewModel: ReviewModel | null = null;

function getProductModel(): ProductModel {
  if (!productModel) productModel = new ProductModel();
  return productModel;
}
function getUserModel(): UserModel {
  if (!userModel) userModel = new UserModel();
  return userModel;
}
function getReviewModel(): ReviewModel {
  if (!reviewModel) reviewModel = new ReviewModel();
  return reviewModel;
}

/** 搜索结果中的商品类型（包含关联数据）/ Enriched product in search results */
interface EnrichedSearchHit {
  listingID: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  condition: string;
  location: string;
  categoryID: number;
  sellerID: string;
  status: string;
  views: number;
  deliveryType: string;
  createdAt: string;
  updatedAt: string;
  images: any[];
  seller: {
    userID: string;
    name: string;
    profileImage: string | null;
    isVerified: boolean;
    isAdmin: boolean;
    rating: number;
  } | null;
  category: any;
}

/**
 * GET /api/search
 * 前端专用搜索接口 — 优先 Meilisearch，自动回退 SQL
 * Frontend search endpoint — Meilisearch first, auto-fallback to SQL
 */
router.get('/',
  [
    query('q').optional().trim(),
    query('category').optional().isInt({ min: 1 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('condition').optional().isIn(['new', 'used', 'like_new']),
    query('sortBy').optional().isIn(['price_asc', 'price_desc', 'date_asc', 'date_desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: errors.array() },
        });
      }

      const q = (req.query['q'] as string || '').trim();
      const category = req.query['category'] ? parseInt(req.query['category'] as string) : undefined;
      const minPrice = req.query['minPrice'] ? parseFloat(req.query['minPrice'] as string) : undefined;
      const maxPrice = req.query['maxPrice'] ? parseFloat(req.query['maxPrice'] as string) : undefined;
      const condition = req.query['condition'] as string | undefined;
      const sortBy = req.query['sortBy'] as string | undefined;
      const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 20;
      const offset = (page - 1) * limit;

      let hits: any[] = [];
      let total = 0;
      let engine: 'meilisearch' | 'sqlite' = 'sqlite';

      // ── 优先 Meilisearch / Prefer Meilisearch ──────────────────────────
      if (meilisearchService.isReady()) {
        try {
          // 构建过滤条件 / Build filter expressions
          const filters: string[] = ["status = 'active'"];
          if (category) filters.push(`categoryID = ${category}`);
          if (minPrice !== undefined) filters.push(`price >= ${minPrice}`);
          if (maxPrice !== undefined) filters.push(`price <= ${maxPrice}`);
          if (condition) filters.push(`condition = '${condition}'`);

          // 构建排序 / Build sort
          const sort: string[] = [];
          if (sortBy === 'price_asc') sort.push('price:asc');
          else if (sortBy === 'price_desc') sort.push('price:desc');
          else if (sortBy === 'date_asc') sort.push('createdAt:asc');
          else if (sortBy === 'date_desc') sort.push('createdAt:desc');

          const meiliResult = await meilisearchService.search(q || '', {
            filter: filters,
            sort: sort.length > 0 ? sort : [],
            limit,
            offset,
          });

          hits = meiliResult.hits.map((h: MeiliProduct) => ({ ...h, listingID: h.id }));
          total = meiliResult.estimatedTotalHits;
          engine = 'meilisearch';
        } catch (e) {
          console.warn('[Search] Meilisearch 失败，回退 SQL / Meilisearch failed, falling back to SQL:', e);
        }
      }

      // ── SQL 回退 / SQL fallback ────────────────────────────────────────
      if (engine === 'sqlite') {
        const sqlFilters: any = {};
        if (category) sqlFilters.category = category;
        if (minPrice !== undefined) sqlFilters.minPrice = minPrice;
        if (maxPrice !== undefined) sqlFilters.maxPrice = maxPrice;
        if (condition) sqlFilters.condition = condition;
        if (sortBy) sqlFilters.sortBy = sortBy;

        const sqlResult = await getProductModel().searchProducts(q || undefined, sqlFilters, page, limit);
        hits = sqlResult.data;
        total = sqlResult.pagination.total;
      }

      // ── 丰富商品数据（图片、卖家、分类）/ Enrich with images, seller, category ──
      const enriched: EnrichedSearchHit[] = await Promise.all(
        hits.map(async (product: any) => {
          const [images, seller, cat] = await Promise.all([
            getProductModel().getProductImages(product.listingID),
            getUserModel().getUserById(product.sellerID),
            getProductModel().getCategoryById(product.categoryID),
          ]);

          let sellerRating = 5;
          try {
            const rd = await getReviewModel().getAverageRating(product.sellerID);
            if (rd && rd.totalReviews > 0) sellerRating = rd.averageRating;
          } catch (_e) {}

          return {
            ...product,
            images,
            seller: seller ? {
              userID: seller.userID,
              name: seller.name,
              profileImage: seller.profileImage || null,
              isVerified: !!seller.isVerified,
              isAdmin: !!seller.isAdmin,
              rating: sellerRating,
            } : null,
            category: cat,
          };
        })
      );

      // ── 标准化响应 / Standardized response ────────────────────────────
      return res.json({
        success: true,
        data: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        engine,
      });
    } catch (error) {
      console.error('[Search] 搜索失败 / Search failed:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SEARCH_FAILED', message: 'Search failed' },
      });
    }
  }
);

export default router;
