/**
 * MeilisearchService — Meilisearch 搜索引擎服务封装（企业级重构版）
 *
 * 设计原则：
 * - 数据与逻辑解耦：同义词配置从 src/config/synonyms.json 动态加载
 * - 优雅降级：所有 Meilisearch 操作失败仅记录日志，不影响核心业务
 * - 单例模式：全局唯一实例，避免重复连接
 *
 * 注意：meilisearch 包是 ESM-only，需要用 eval('import()') 绕过 ts-node 编译
 */
import fs from 'fs';
import path from 'path';
import { ProductModel } from '../models/ProductModel';

// ─── 索引文档类型定义 / Index document type ─────────────────────────────────

/** Meilisearch 中存储的商品文档结构，与 SQLite ProductListing 表对应 */
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

/** 搜索结果类型（包含 processingTimeMs）*/
export interface MeiliSearchResult {
  hits: MeiliProduct[];
  estimatedTotalHits: number;
  processingTimeMs: number;
}

// ─── 服务配置 / Service config ───────────────────────────────────────────────

const MEILI_HOST = process.env['MEILI_HOST'] || 'http://localhost:7700';
const MEILI_API_KEY = process.env['MEILI_API_KEY'] || '';
const INDEX_NAME = 'products';
const PRIMARY_KEY = 'id';

/** 同义词配置文件路径 */
const SYNONYMS_PATH = path.join(__dirname, '../config/synonyms.json');

// ─── 服务类 / Service class ─────────────────────────────────────────────────

class MeilisearchService {
  private client: any = null;
  private index: any = null;
  private ready = false;

  constructor() {}

  /**
   * 初始化：动态加载 ESM 包 → 创建索引 → 配置属性 → 加载高级规则
   */
  async initialize(): Promise<void> {
    try {
      // 动态导入 ESM-only 的 meilisearch 包
      const meili = await eval('import("meilisearch")') as any;
      const MeiliSearch = meili.Meilisearch || meili.MeiliSearch || meili.default;

      this.client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY });

      // 创建或获取索引（已存在则静默跳过）
      try { await this.client.createIndex(INDEX_NAME, { primaryKey: PRIMARY_KEY }); } catch (_e) {}
      this.index = this.client.index(INDEX_NAME);

      // 配置索引属性
      await this.configureIndexAttributes();

      // 加载高级搜索规则（同义词、排名、容错）
      await this.initMeiliSettings();

      this.ready = true;
      console.log('[Meilisearch] 索引初始化完成 / Index initialized');
    } catch (error) {
      console.warn('[Meilisearch] 初始化失败，搜索将回退到 SQL LIKE / Init failed, fallback to SQL:', error);
      this.ready = false;
    }
  }

  /** 检查服务是否可用 */
  isReady(): boolean {
    return this.ready && this.index !== null;
  }

  // ─── 索引属性配置 / Index attribute configuration ──────────────────────

  /**
   * 配置可搜索、可过滤、可排序属性
   * 严格限制搜索字段为 title 和 description，防止匹配到 id/价格等无关字段
   */
  private async configureIndexAttributes(): Promise<void> {
    if (!this.index) return;

    // 可搜索属性：仅标题和描述（按权重排序，title 优先）
    await this.index.updateSearchableAttributes(['title', 'description']);

    // 可过滤属性：支持前端筛选
    await this.index.updateFilterableAttributes([
      'categoryID', 'price', 'condition', 'location', 'status', 'sellerID',
    ]);

    // 可排序属性：支持前端排序
    await this.index.updateSortableAttributes(['price', 'createdAt', 'views']);
  }

  // ─── 高级搜索配置（数据与逻辑解耦）/ Advanced settings ────────────────

  /**
   * 从 synonyms.json 加载同义词，配置排名规则和拼写容错
   * 修改同义词只需编辑 src/config/synonyms.json，重启后端即可生效
   */
  async initMeiliSettings(): Promise<void> {
    if (!this.index) return;
    try {
      // 1. 从 JSON 文件动态加载同义词（数据与逻辑解耦）
      const synonyms = this.loadSynonyms();
      await this.index.updateSynonyms(synonyms);
      console.log(`[Meilisearch] 已加载 ${Object.keys(synonyms).length} 组同义词 / Loaded ${Object.keys(synonyms).length} synonym groups`);

      // 2. 排名规则：自定义搜索结果排序优先级
      await this.index.updateRankingRules([
        'words',      // 匹配词数
        'typo',       // 拼写容错
        'proximity',  // 词语接近度
        'attribute',  // 属性权重（title > description）
        'sort',       // 用户自定义排序
        'exactness',  // 精确匹配
      ]);

      // 3. 拼写容错配置
      await this.index.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: { 
          oneTypo: 3, // 从 4 降到 3。兼顾中文的 3字词（如“充电器”）和较长的英文短词。
          twoTypos: 7 // 从 8 降到 7。
        },
        // 核心优化：豁免词典 (Disable Typos On Words)
        // 把绝对不能容错的短词保护起来，防止调低门槛后出现“指鹿为马”的情况。
        disableOnWords: [
          'pc', 'mac', 'pad', 'hp', 'ns', // 极短的英文专有名词，错一个字母就变成了别的意思
          '全新', '二手', '闲置', // 交易属性词，必须精确匹配
          '手机', '电脑', '微单' // 虽然只有2个字本来就不会纠错，但为了未来系统扩展，建议把核心品类写上
        ],
        // 如果未来把 category（分类）或 brand（品牌）设为了可搜索字段，
        // 强烈建议在这里禁用纠错，保证分类筛选的绝对精确。
        disableOnAttributes: [] 
      });

      console.log('[Meilisearch] 高级搜索规则配置完成 / Advanced settings configured');
    } catch (error) {
      console.error('[Meilisearch] 高级搜索规则配置失败（不影响基础搜索）/ Advanced settings failed:', error);
    }
  }

  /**
   * 从 src/config/synonyms.json 读取同义词配置
   * 过滤掉以 _ 开头的注释字段
   */
  private loadSynonyms(): Record<string, string[]> {
    try {
      const raw = fs.readFileSync(SYNONYMS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // 过滤掉 _comment 等非同义词字段
      const synonyms: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (!key.startsWith('_') && Array.isArray(value)) {
          synonyms[key] = value as string[];
        }
      }
      return synonyms;
    } catch (error) {
      console.error('[Meilisearch] 读取同义词文件失败 / Failed to load synonyms.json:', error);
      return {};
    }
  }

  // ─── 文档操作（双写）/ Document operations (dual-write) ────────────────

  /**
   * 添加或更新商品文档（创建/更新双写）
   * 失败仅记录日志，绝不抛出异常
   */
  async upsertProduct(product: MeiliProduct): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.index!.addDocuments([product]);
    } catch (error) {
      console.error('[Meilisearch] 双写同步失败 / Dual-write sync failed:', product.id, error);
    }
  }

  /**
   * 删除商品文档（删除双写）
   * 失败仅记录日志，绝不抛出异常
   */
  async deleteProduct(productId: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.index!.deleteDocument(productId);
    } catch (error) {
      console.error('[Meilisearch] 双写删除失败 / Dual-write delete failed:', productId, error);
    }
  }

  // ─── 搜索（含 processingTimeMs）/ Search ───────────────────────────────

  /**
   * 搜索商品，返回结果包含 processingTimeMs
   */
  async search(
    query: string,
    options?: { filter?: string[]; sort?: string[]; limit?: number; offset?: number }
  ): Promise<MeiliSearchResult> {
    if (!this.isReady()) {
      return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
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
        processingTimeMs: result.processingTimeMs || 0,
      };
    } catch (error) {
      console.error('[Meilisearch] 搜索失败 / Search failed:', error);
      return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
    }
  }

  // ─── 全量同步 / Full sync ──────────────────────────────────────────────

  async fullSync(): Promise<{ synced: number }> {
    if (!this.index) throw new Error('Meilisearch index not initialized');

    const productModel = new ProductModel();
    const allProducts: any[] = await (productModel as any).query(
      "SELECT * FROM ProductListing WHERE status = 'active' ORDER BY createdAt DESC"
    );

    const documents: MeiliProduct[] = allProducts.map(toMeiliProduct);

    await this.index.deleteAllDocuments();
    if (documents.length > 0) await this.index.addDocuments(documents);

    console.log(`[Meilisearch] 全量同步完成：${documents.length} 条 / Full sync: ${documents.length} products`);
    return { synced: documents.length };
  }
}

// ─── 工具函数 / Utility ──────────────────────────────────────────────────────

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

// ─── 单例导出 / Singleton export ─────────────────────────────────────────────

export const meilisearchService = new MeilisearchService();
