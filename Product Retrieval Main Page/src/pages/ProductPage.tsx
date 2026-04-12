import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { ComparisonBar } from '../components/ComparisonBar';
import { useLanguage } from '../lib/LanguageContext';
import { useComparison } from '../lib/ComparisonContext';
import { productService } from '../services';
import { Product } from '../lib/mockData';
import { translate } from '../lib/i18n';
import { Loader2 } from 'lucide-react';
import { Toaster } from '../components/ui/sonner';
import { toast } from 'sonner';

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { comparisonProducts, toggleProduct, removeProduct, clearAll, isInComparison } = useComparison();

  useEffect(() => {
    if (!productId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        setProduct(data);

        const allProducts = await productService.getProducts({ limit: 20 });
        const related = allProducts.products
          .filter(p => p.category === data.category && p.id !== data.id)
          .slice(0, 6);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const handleCompare = (id: string) => {
    const all = product ? [product, ...relatedProducts] : relatedProducts;
    const target = all.find((p: Product) => p.id === id);
    if (!target) return;
    const result = toggleProduct(target);
    if (result === 'added') toast.success(t('addedToComparison'));
    else if (result === 'removed') toast.success(t('removedFromComparison'));
    else toast.error(t('maxCompareItems'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} unreadMessages={0} />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} unreadMessages={0} />
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header language={language} onLanguageChange={setLanguage} unreadMessages={0} />
      <ProductDetailPage
        product={product}
        relatedProducts={relatedProducts}
        language={language}
        onBack={() => navigate(-1)}
        onProductClick={(p) => navigate(`/product/${p.id}`)}
        onCompare={handleCompare}
        isInComparison={isInComparison(product.id)}
      />
      <ComparisonBar
        language={language}
        selectedProducts={comparisonProducts}
        onRemove={(id) => removeProduct(id)}
        onClear={() => clearAll()}
      />
    </div>
  );
}
