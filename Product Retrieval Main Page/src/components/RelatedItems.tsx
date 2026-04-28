import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../lib/mockData';
import { Language, translate } from '../lib/i18n';
import { ProductCard } from './ProductCard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useComparison } from '../lib/ComparisonContext';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../services/authContext';
import { chatService } from '../services/chatService';
import { toast } from 'sonner';

interface RelatedItemsProps {
  products: Product[];
  language: Language;
  onProductClick: (product: Product) => void;
  onFavorite?: (id: string) => void;
  favoritedIds?: string[];
}

export function RelatedItems({ products, language, onProductClick, onFavorite, favoritedIds = [] }: RelatedItemsProps) {
  const t = (key: any) => translate(language, key);
  const [startIndex, setStartIndex] = useState(0);
  const { toggleProduct, isInComparison } = useComparison();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const itemsPerView = 4;

  const handleContact = async (product: Product) => {
    if (!user) { navigate('/login'); return; }
    if (!product.seller?.id) return;
    try {
      const res = await chatService.createOrGetChat(product.id, product.seller.id);
      const chatID = res.data.data?.chatID;
      if (chatID) {
        navigate(`/chat/${chatID}`, { state: { from: location.pathname } });
      }
    } catch (err: any) {
      toast.error(err?.friendlyMessage || err?.suspendedMessage || err?.response?.data?.error?.message || 'Failed to open chat');
    }
  };

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + itemsPerView < products.length;

  const scrollLeft = () => {
    setStartIndex(Math.max(0, startIndex - itemsPerView));
  };

  const scrollRight = () => {
    setStartIndex(Math.min(products.length - itemsPerView, startIndex + itemsPerView));
  };

  const visibleProducts = products.slice(startIndex, startIndex + itemsPerView);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('youMayAlsoLike')}</CardTitle>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleProducts.map((product) => (
            <div key={product.id} onClick={() => onProductClick(product)} className="cursor-pointer">
              <ProductCard
                product={product}
                language={language}
                onCompare={() => toggleProduct(product)}
                onFavorite={onFavorite || (() => {})}
                onContact={() => handleContact(product)}
                isInComparison={isInComparison(product.id)}
                isFavorited={favoritedIds.includes(product.id)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
