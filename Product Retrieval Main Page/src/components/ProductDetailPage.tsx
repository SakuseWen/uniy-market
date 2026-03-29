import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Heart, Scale, Flag, MessageCircle, ShoppingCart, Check, X as XIcon, Loader2 } from 'lucide-react';
import { Product } from '../lib/mockData';
import { Language, translate } from '../lib/i18n';
import { Button } from './ui/button';
import { useAuth } from '../services/authContext';
import { favoriteService } from '../services/favoriteService';
import { dealService } from '../services/dealService';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { ProductImageCarousel } from './ProductImageCarousel';
import { SellerInfoCard } from './SellerInfoCard';
import { ProductTabs } from './ProductTabs';
import { SafetyNotice } from './SafetyNotice';
import { RelatedItems } from './RelatedItems';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  language: Language;
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

export function ProductDetailPage({
  product,
  relatedProducts,
  language,
  onBack,
  onProductClick,
}: ProductDetailPageProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [deal, setDeal] = useState<any>(null);
  const [dealLoading, setDealLoading] = useState(false);

  // Check if product is favorited
  useEffect(() => {
    if (!user || !product.id) return;
    favoriteService.checkBatch([product.id]).then(result => {
      setIsFavorite(!!result[product.id]);
    }).catch(() => {});
  }, [user, product.id]);

  // Load deal status for this product
  useEffect(() => {
    if (!user || !product.id) return;
    dealService.getDealForProduct(product.id).then(d => setDeal(d)).catch(() => {});
  }, [user, product.id]);

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return; }
    if (!product.seller?.id) return;
    setDealLoading(true);
    try {
      const newDeal = await dealService.createDeal(product.id, user.userID, product.seller.id, product.price);
      setDeal(newDeal);
      toast.success(t('dealRequestSent') || 'Purchase request sent');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create deal');
    } finally { setDealLoading(false); }
  };

  const handleAcceptDeal = async () => {
    if (!deal) return;
    setDealLoading(true);
    try {
      await dealService.acceptDeal(deal.dealID);
      setDeal({ ...deal, notes: 'accepted' });
      toast.success(t('dealAccepted') || 'Deal accepted');
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setDealLoading(false); }
  };

  const handleRejectDeal = async () => {
    if (!deal) return;
    setDealLoading(true);
    try {
      await dealService.rejectDeal(deal.dealID);
      setDeal(null);
      toast.success(t('dealRejected') || 'Deal rejected');
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setDealLoading(false); }
  };

  const handleConfirmDeal = async () => {
    if (!deal) return;
    setDealLoading(true);
    try {
      const res = await dealService.confirmDeal(deal.dealID);
      if (res.completed) {
        setDeal({ ...deal, status: 'completed' });
        toast.success(t('dealCompleted') || 'Transaction completed');
      } else {
        const isBuyer = user?.userID === deal.buyerID;
        setDeal({ ...deal, [isBuyer ? 'buyerConfirmed' : 'sellerConfirmed']: true });
        toast.success(t('dealConfirmedWaiting') || 'Confirmed. Waiting for the other party.');
      }
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setDealLoading(false); }
  };

  const handleCancelDeal = async () => {
    if (!deal) return;
    setDealLoading(true);
    try {
      await dealService.cancelDeal(deal.dealID);
      setDeal(null);
      toast.success(t('dealCancelled') || 'Deal cancelled');
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setDealLoading(false); }
  };

  const handleToggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(product.id);
        setIsFavorite(false);
        toast.success(t('removedFromFavorites'));
      } else {
        await favoriteService.addFavorite(product.id);
        setIsFavorite(true);
        toast.success(t('addedToFavorites'));
      }
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const getLocalizedTitle = () => {
    if (language === 'zh' && product.titleZh) return product.titleZh;
    if (language === 'th' && product.titleTh) return product.titleTh;
    return product.title;
  };

  const getLocalizedDescription = () => {
    if (language === 'zh' && product.descriptionZh) return product.descriptionZh;
    if (language === 'th' && product.descriptionTh) return product.descriptionTh;
    return product.description;
  };

  const formatPrice = (price: number) => {
    if (language === 'th') return `฿${price.toLocaleString()}`;
    if (language === 'zh') return `¥${price.toLocaleString()}`;
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={onBack} className="cursor-pointer">
                  {t('home')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>{t(product.category)}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{getLocalizedTitle()}</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Image Carousel */}
          <ProductImageCarousel
            images={product.images || [product.image]}
            title={getLocalizedTitle()}
            badges={product.badges}
            language={language}
          />

          {/* Right: Product Summary */}
          <div className="bg-white rounded-lg p-6 h-fit sticky top-20">
            {/* Title */}
            <h1 className="mb-4">{getLocalizedTitle()}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-blue-600">{formatPrice(product.price)}</span>
              {product.negotiable && (
                <Badge variant="secondary">{t('negotiable')}</Badge>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
              <div>
                <div className="text-gray-500 mb-1">{t('condition')}</div>
                <div>{t(product.condition)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('category')}</div>
                <div>{t(product.category)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('postedOn')}</div>
                <div>{formatDate(product.publishedDate)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('campus')}</div>
                <div>{t(product.campus)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('availability')}</div>
                <div>
                  {product.sold ? (
                    <Badge variant="secondary">{t('sold')}</Badge>
                  ) : (
                    <Badge className="bg-green-500">{t('inStock')}</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('views')}</div>
                <div>{product.views.toLocaleString()} {t('views')}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{t('deliveryType')}</div>
                <div>{product.deliveryType?.map(d => t(d)).join(', ') || t('faceToFace')}</div>
              </div>
            </div>

            {/* Tags */}
            {product.badges && product.badges.length > 0 && (
              <div className="mb-6">
                <div className="text-gray-500 mb-2">{t('tags')}</div>
                <div className="flex flex-wrap gap-2">
                  {product.badges.map((badge) => (
                    <Badge key={badge} variant="outline">
                      {t(badge)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Buy button - only for non-owner, non-sold, no active deal */}
              {user && product.seller?.id !== user.userID && !product.sold && !deal && (
                <Button className="w-full col-span-2 text-white hover:shadow-lg hover:scale-105 transition-all duration-200" style={{ background: '#16a34a' }} onClick={handleBuy} disabled={dealLoading}>
                  {dealLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                  {t('buy')}
                </Button>
              )}

              {/* Status indicators */}
              {deal && deal.status === 'pending' && !deal.notes && (
                <div className="col-span-2 text-center py-2 text-sm" style={{ color: '#ea580c', background: '#fff7ed', borderRadius: 8 }}>
                  {t('waitingSellerAccept')}
                </div>
              )}
              {deal && deal.status === 'pending' && deal.notes === 'accepted' && (
                <div className="col-span-2 text-center py-2 text-sm" style={{ color: '#2563eb', background: '#eff6ff', borderRadius: 8 }}>
                  {t('inTransaction') || 'In Transaction'}
                </div>
              )}
              {deal && deal.status === 'completed' && (
                <div className="col-span-2 text-center py-2 text-sm font-semibold" style={{ color: '#16a34a', background: '#f0fdf4', borderRadius: 8 }}>
                  ✓ {t('dealCompleted')}
                </div>
              )}

              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200" onClick={() => {
                if (!user) { navigate('/login'); return; }
                if (product.seller.id) navigate(`/chat/${product.seller.id}`);
              }}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('contactSeller')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleToggleFavorite}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {t('addToFavorites')}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                <Scale className="w-4 h-4 mr-2" />
                {t('addToCompare')}
              </Button>
              <Button variant="outline" className="w-full">
                <Flag className="w-4 h-4 mr-2" />
                {t('reportListing')}
              </Button>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="mb-8">
          <SellerInfoCard seller={product.seller} language={language} />
        </div>

        {/* Product Details Tabs */}
        <div className="mb-8">
          <ProductTabs
            description={getLocalizedDescription() || ''}
            specifications={product.specifications}
            language={language}
            listingID={product.id}
            sellerID={product.seller?.id}
          />
        </div>

        {/* Safety Notice */}
        <div className="mb-8">
          <SafetyNotice language={language} />
        </div>

        {/* Related Items */}
        <RelatedItems
          products={relatedProducts}
          language={language}
          onProductClick={onProductClick}
        />
      </div>
    </div>
  );
}
