import { useState, useEffect, useCallback } from 'react';
import { productService, ProductFilters } from '../services/productService';
import { Product } from '../lib/mockData';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
}

export function useProducts(filters: ProductFilters = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(filters.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.getProducts({
        ...filters,
        page,
      });

      setProducts(response.products);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setHasNext(response.hasNext);
      setHasPrev(response.hasPrev);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.error?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    page,
    totalPages,
    total,
    hasNext,
    hasPrev,
    refetch: fetchProducts,
    setPage,
  };
}

// Hook for single product
export function useProduct(id: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(err.response?.data?.error?.message || 'Failed to load product');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}

// Hook for categories
export function useCategories() {
  const [categories, setCategories] = useState<Array<{ categoryID: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getCategories();
        setCategories(data);
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
        setError(err.response?.data?.error?.message || 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
