/**
 * 汇率转换工具 — 从泰铢转换到人民币/美元
 * Currency conversion utility — THB to CNY/USD
 *
 * 使用 ExchangeRate-API 免费接口，每天缓存一次汇率
 * Uses free ExchangeRate-API, caches rates daily in localStorage
 */

export type CurrencyCode = 'THB' | 'CNY' | 'USD';

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

const CACHE_KEY = 'exchangeRates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const SYMBOLS: Record<CurrencyCode, string> = {
  THB: '฿',
  CNY: '¥',
  USD: '$',
};

const LABELS: Record<CurrencyCode, string> = {
  THB: '฿ THB',
  CNY: '¥ CNY',
  USD: '$ USD',
};

/** 获取缓存的汇率 / Get cached rates */
function getCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached;
    return null;
  } catch {
    return null;
  }
}

/** 从 API 获取最新汇率并缓存 / Fetch latest rates from API and cache */
async function fetchRates(): Promise<Record<string, number>> {
  const cached = getCachedRates();
  if (cached) return cached.rates;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/THB');
    const data = await res.json();
    if (data.result === 'success' && data.rates) {
      const rates = data.rates as Record<string, number>;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
      return rates;
    }
  } catch (err) {
    console.warn('[Currency] Failed to fetch rates:', err);
  }

  // Fallback rates (approximate)
  return { THB: 1, CNY: 0.2, USD: 0.029 };
}

/** 转换价格 / Convert price */
export async function convertPrice(thbAmount: number, to: CurrencyCode): Promise<number> {
  if (to === 'THB') return thbAmount;
  const rates = await fetchRates();
  const rate = rates[to] || 1;
  return thbAmount * rate;
}

/** 格式化价格显示 / Format price display */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return `${SYMBOLS[currency]}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export { SYMBOLS, LABELS };
