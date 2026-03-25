import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { useLanguage } from '../lib/LanguageContext';
import { productService } from '../services';
import { Product } from '../lib/mockData';
import { Loader2 } from 'lucide-react';

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [productId]);

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
    <ProductDetailPage
      product={product}
      relatedProducts={[]}
      language={language}
      onBack={() => navigate(-1)}
      onProductClick={(p) => navigate(`/product/${p.id}`)}
    />
  );
}
