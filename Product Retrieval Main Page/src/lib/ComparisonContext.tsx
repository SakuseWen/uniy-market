import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from './mockData';

interface ComparisonContextType {
  comparisonIds: string[];
  comparisonProducts: Product[];
  addProduct: (product: Product) => boolean;
  removeProduct: (id: string) => void;
  toggleProduct: (product: Product) => 'added' | 'removed' | 'full';
  clearAll: () => void;
  isInComparison: (id: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  const addProduct = useCallback((product: Product) => {
    let added = false;
    setProducts((prev: Product[]) => {
      if (prev.some((p: Product) => p.id === product.id)) return prev;
      if (prev.length >= 4) return prev;
      added = true;
      return [...prev, product];
    });
    return added;
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== id));
  }, []);

  const toggleProduct = useCallback((product: Product): 'added' | 'removed' | 'full' => {
    let result: 'added' | 'removed' | 'full' = 'added';
    setProducts((prev: Product[]) => {
      if (prev.some((p: Product) => p.id === product.id)) {
        result = 'removed';
        return prev.filter((p: Product) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        result = 'full';
        return prev;
      }
      result = 'added';
      return [...prev, product];
    });
    return result;
  }, []);

  const clearAll = useCallback(() => {
    setProducts([]);
  }, []);

  const isInComparison = useCallback(
    (id: string) => products.some((p: Product) => p.id === id),
    [products]
  );

  return (
    <ComparisonContext.Provider
      value={{
        comparisonIds: products.map((p: Product) => p.id),
        comparisonProducts: products,
        addProduct,
        removeProduct,
        toggleProduct,
        clearAll,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error('useComparison must be used within ComparisonProvider');
  return ctx;
}
