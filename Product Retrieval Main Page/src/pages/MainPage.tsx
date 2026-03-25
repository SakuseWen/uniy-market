import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { ProductCard } from '../components/ProductCard';
import { ProductListView } from '../components/ProductListView';
import { SideFilterPanel } from '../components/SideFilterPanel';
import { ComparisonBar } from '../components/ComparisonBar';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { useProducts, useCategories } from '../hooks';
import { Grid, List, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { useAuth } from '../services/authContext';
import { useLanguage } from '../lib/LanguageContext';

export default function MainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 从全局 Context 读取语言状态 / Read language from global Context
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  // User state
  const [unreadMessages] = useState(3);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    campus: 'all',
    category: 'all',
    priceMin: 0,
    priceMax: 0,
    condition: 'all',
    deliveryType: 'all',
    itemLanguage: 'all',
    availableOnly: true,
  });

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    brand: '',
    courseCode: '',
    tryBeforeBuy: false,
    showPriceTrend: false,
  });

  // Side panel state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('relevance');

  // Comparison state
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);

  // Fetch products from API
  const apiFilters = useMemo(() => {
    const result: any = {
      q: searchQuery || undefined,
      page: 1,
      limit: 100,
    };

    // Map frontend category string to backend categoryID
    const categoryIdMap: Record<string, number> = {
      'electronics': 1,
      'books': 2,
      'clothing': 3,
      'dormFurniture': 4,
      'sports': 5,
      'others': 6,
    };

    if (filters.category !== 'all' && categoryIdMap[filters.category]) {
      result.category = categoryIdMap[filters.category];
    }
    if (filters.priceMin > 0) {
      result.minPrice = filters.priceMin;
    }
    if (filters.priceMax > 0) {
      result.maxPrice = filters.priceMax;
    }

    // Map frontend condition to backend condition
    const conditionMap: Record<string, string> = {
      'new': 'new',
      'ninetyNew': 'like_new',
      'eightyNew': 'used',
    };

    if (filters.condition !== 'all' && conditionMap[filters.condition]) {
      result.condition = conditionMap[filters.condition];
    }
    if (filters.campus !== 'all') {
      result.location = filters.campus;
    }

    // Map sortBy to API format
    if (sortBy === 'latest') {
      result.sortBy = 'date_desc';
    } else if (sortBy === 'priceLowToHigh') {
      result.sortBy = 'price_asc';
    } else if (sortBy === 'priceHighToLow') {
      result.sortBy = 'price_desc';
    }

    return result;
  }, [searchQuery, filters, sortBy]);

  const { products: apiProducts, loading, error } = useProducts(apiFilters);
  const { categories } = useCategories();

  // Filter products (client-side filtering for advanced filters)
  const filteredProducts = useMemo(() => {
    let results = [...apiProducts];

    // Filter out sold items if availableOnly is true
    if (filters.availableOnly) {
      results = results.filter((p) => !p.sold);
    }

    // Advanced filters - Brand
    if (advancedFilters.brand.trim()) {
      results = results.filter((p) =>
        p.brand?.toLowerCase().includes(advancedFilters.brand.toLowerCase())
      );
    }

    // Advanced filters - Course Code
    if (advancedFilters.courseCode.trim()) {
      results = results.filter((p) =>
        p.courseCode
          ?.toLowerCase()
          .includes(advancedFilters.courseCode.toLowerCase())
      );
    }

    // Client-side sorting for 'nearest' (API doesn't support this)
    if (sortBy === 'nearest') {
      results.sort((a, b) => {
        const aDistance = parseFloat(a.distance || '999');
        const bDistance = parseFloat(b.distance || '999');
        return aDistance - bDistance;
      });
    }

    return results;
  }, [apiProducts, filters.availableOnly, advancedFilters, sortBy]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Comparison products
  const comparisonProducts = useMemo(() => {
    return apiProducts.filter((p) => comparisonIds.includes(p.id));
  }, [comparisonIds, apiProducts]);

  // Handlers
  const handleFavorite = (id: string) => {
    setFavoritedIds((prev) => {
      if (prev.includes(id)) {
        toast.success(t('removedFromFavorites'));
        return prev.filter((fId) => fId !== id);
      } else {
        toast.success(t('addedToFavorites'));
        return [...prev, id];
      }
    });
  };

  const handleCompare = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        toast.success(t('removedFromComparison'));
        return prev.filter((cId) => cId !== id);
      } else if (prev.length >= 4) {
        toast.error(t('maxCompareItems'));
        return prev;
      } else {
        toast.success(t('addedToComparison'));
        return [...prev, id];
      }
    });
  };

  const handleContact = (sellerId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${sellerId}`);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleBackToList = () => {
    navigate('/');
  };

  // Get related products (same category, different id)
  const getRelatedProducts = (product: Product) => {
    return apiProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        unreadMessages={unreadMessages}
      />

      {/* Search and Filter Bar */}
      <SearchFilterBar
        language={language}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Toolbar - View Mode and Sorting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {t('showing')} <strong>{filteredProducts.length}</strong> {t('results')}
            </span>

            {/* Price Trend Indicator */}
            {advancedFilters.showPriceTrend && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Price trends enabled</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t('relevance')}</SelectItem>
                <SelectItem value="latest">{t('latest')}</SelectItem>
                <SelectItem value="priceLowToHigh">{t('priceLowToHigh')}</SelectItem>
                <SelectItem value="priceHighToLow">{t('priceHighToLow')}</SelectItem>
                <SelectItem value="nearest">{t('nearest')}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Failed to load products</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2">{t('noResults')}</h3>
            <p className="text-gray-600 mb-4">{t('noResultsDesc')}</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  campus: 'all',
                  category: 'all',
                  priceMin: 0,
                  priceMax: 0,
                  condition: 'all',
                  deliveryType: 'all',
                  itemLanguage: 'all',
                  availableOnly: true,
                });
                setAdvancedFilters({
                  brand: '',
                  courseCode: '',
                  tryBeforeBuy: false,
                  showPriceTrend: false,
                });
              }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
            {filteredProducts.map((product) => (
              <div key={product.id} onClick={() => handleProductClick(product)} className="cursor-pointer">
                <ProductCard
                  product={product}
                  language={language}
                  onFavorite={handleFavorite}
                  onCompare={handleCompare}
                  onContact={handleContact}
                  isFavorited={favoritedIds.includes(product.id)}
                  isInComparison={comparisonIds.includes(product.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pb-32">
            {filteredProducts.map((product) => (
              <div key={product.id} onClick={() => handleProductClick(product)} className="cursor-pointer">
                <ProductListView
                  product={product}
                  language={language}
                  onFavorite={handleFavorite}
                  onCompare={handleCompare}
                  onContact={handleContact}
                  isFavorited={favoritedIds.includes(product.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Filter Panel */}
      <SideFilterPanel
        language={language}
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        advancedFilters={advancedFilters}
        onAdvancedFilterChange={setAdvancedFilters}
      />

      {/* Comparison Bar */}
      <ComparisonBar
        language={language}
        selectedProducts={comparisonProducts}
        onRemove={(id) => setComparisonIds((prev) => prev.filter((cId) => cId !== id))}
        onClear={() => setComparisonIds([])}
      />
    </div>
  );
}
