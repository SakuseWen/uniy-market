/**
 * MeilisearchService — Meilisearch 搜索引擎服务封装
 *
 * 职责：
 * 1. 管理与 Meilisearch 实例的连接
 * 2. 初始化 products 索引及可搜索/可过滤属性
 * 3. 提供文档的增删改查方法（供双写逻辑调用）
 * 4. 提供全量同步方法（供管理端调用）
 *
 * 注意：meilisearch 包是 ESM-only，需要用 dynamic import() 加载
 */
import { ProductModel } from '../models/ProductModel';

// ─── 索引文档类型定义 / Index document type ─────────────────────────────────

/** Meilisearch 中存储的商品文档结构 */
export interface MeiliProduct {
  /** 主键，对应 SQLite ProductListing.listingID */
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  condition: 'new' | 'used' | 'like_new';
  location: string;
  categoryID: number;
  sellerID: string;
  status: string;
  views: number;
  deliveryType: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 服务配置 / Service config ───────────────────────────────────────────────

const MEILI_HOST = process.env['MEILI_HOST'] || 'http://localhost:7700';
const MEILI_API_KEY = process.env['MEILI_API_KEY'] || '';
const INDEX_NAME = 'products';
const PRIMARY_KEY = 'id';

// ─── 服务类 / Service class ─────────────────────────────────────────────────

class MeilisearchService {
  private client: any = null;
  private index: any = null;
  private ready = false;

  constructor() {}

  /**
   * 初始化索引：动态加载 ESM 包、创建 index、设置可搜索/可过滤/可排序属性
   */
  async initialize(): Promise<void> {
    try {
      // 动态导入 ESM-only 的 meilisearch 包 / Dynamic import of ESM-only meilisearch package
      // 使用 eval 绕过 ts-node 将 import() 转换为 require() 的行为
      const meili = await eval('import("meilisearch")') as any;
      const { MeiliSearch } = meili;

      this.client = new MeiliSearch({
        host: MEILI_HOST,
        apiKey: MEILI_API_KEY,
      });
      // 创建或获取索引 / Create or get index
      try {
        await this.client.createIndex(INDEX_NAME, { primaryKey: PRIMARY_KEY });
      } catch (_e) {
        // 索引已存在，忽略 / Index already exists, ignore
      }
      this.index = this.client.index(INDEX_NAME);

      // 配置可搜索属性（标题和描述权重最高）/ Configure searchable attributes
      await this.index.updateSearchableAttributes([
        'title',
        'description',
        'location',
      ]);

      // 配置可过滤属性 / Configure filterable attributes
      await this.index.updateFilterableAttributes([
        'categoryID',
        'price',
        'condition',
        'location',
        'status',
        'sellerID',
      ]);

      // 配置可排序属性 / Configure sortable attributes
      await this.index.updateSortableAttributes([
        'price',
        'createdAt',
        'views',
      ]);

      this.ready = true;
      console.log('[Meilisearch] 索引初始化完成 / Index initialized');
    } catch (error) {
      console.warn('[Meilisearch] 初始化失败，搜索将回退到 SQL LIKE / Init failed, search will fallback to SQL LIKE:', error);
      this.ready = false;
    }
  }

  /** 检查服务是否可用 / Check if service is available */
  isReady(): boolean {
    return this.ready && this.index !== null;
  }

  // ─── 文档操作 / Document operations ─────────────────────────────────────

  /**
   * 添加或更新单个商品文档（用于创建/更新双写）
   * Add or update a single product document (for create/update dual-write)
   */
  async upsertProduct(product: MeiliProduct): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.index!.addDocuments([product]);
    } catch (error) {
      console.warn('[Meilisearch] 同步商品失败 / Failed to sync product:', product.id, error);
    }
  }

  /**
   * 删除单个商品文档（用于删除双写）
   * Delete a single product document (for delete dual-write)
   */
  async deleteProduct(productId: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.index!.deleteDocument(productId);
    } catch (error) {
      console.warn('[Meilisearch] 删除商品索引失败 / Failed to delete product from index:', productId, error);
    }
  }

  // ─── 搜索 / Search ─────────────────────────────────────────────────────

  /**
   * 搜索商品
   * Search products with query, filters, pagination
   */
  async search(
    query: string,
    options?: {
      filter?: string[];
      sort?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ hits: MeiliProduct[]; estimatedTotalHits: number }> {
    if (!this.isReady()) {
      return { hits: [], estimatedTotalHits: 0 };
    }
    try {
      const result = await this.index!.search(query, {
        filter: options?.filter,
        sort: options?.sort,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      });
      return {
        hits: result.hits as MeiliProduct[],
        estimatedTotalHits: result.estimatedTotalHits || 0,
      };
    } catch (error) {
      console.warn('[Meilisearch] 搜索失败，将回退到 SQL / Search failed, will fallback to SQL:', error);
      return { hits: [], estimatedTotalHits: 0 };
    }
  }

  // ─── 全量同步 / Full sync ──────────────────────────────────────────────

  /**
   * 从 SQLite 全量同步所有有效商品到 Meilisearch
   * Full sync all active products from SQLite to Meilisearch
   */
  async fullSync(): Promise<{ synced: number }> {
    if (!this.index) {
      throw new Error('Meilisearch index not initialized');
    }

    const productModel = new ProductModel();
    // 查询所有有效商品 / Query all active products
    const allProducts: any[] = await (productModel as any).query(
      "SELECT * FROM ProductListing WHERE status = 'active' ORDER BY createdAt DESC"
    );

    // 映射为 MeiliProduct 格式 / Map to MeiliProduct format
    const documents: MeiliProduct[] = allProducts.map((p: any) => ({
      id: p.listingID,
      title: p.title || '',
      description: p.description || '',
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 1,
      condition: p.condition || 'used',
      location: p.location || '',
      categoryID: Number(p.categoryID),
      sellerID: p.sellerID || '',
      status: p.status || 'active',
      views: Number(p.views) || 0,
      deliveryType: p.deliveryType || 'faceToFace',
      createdAt: p.createdAt || '',
      updatedAt: p.updatedAt || '',
    }));

    // 清空索引后重新导入 / Clear index then re-import
    await this.index.deleteAllDocuments();
    if (documents.length > 0) {
      await this.index.addDocuments(documents);
    }

    console.log(`[Meilisearch] 全量同步完成：${documents.length} 条商品 / Full sync done: ${documents.length} products`);
    return { synced: documents.length };
  }
}

// ─── 单例导出 / Singleton export ─────────────────────────────────────────────

/** 将 SQLite 商品行转换为 MeiliProduct 文档 */
export function toMeiliProduct(row: any): MeiliProduct {
  return {
    id: row.listingID,
    title: row.title || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 1,
    condition: row.condition || 'used',
    location: row.location || '',
    categoryID: Number(row.categoryID),
    sellerID: row.sellerID || '',
    status: row.status || 'active',
    views: Number(row.views) || 0,
    deliveryType: row.deliveryType || 'faceToFace',
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
  };
}

export const meilisearchService = new MeilisearchService();
