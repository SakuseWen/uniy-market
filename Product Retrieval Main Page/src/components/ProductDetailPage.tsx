import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft, Heart, Scale, Flag, MessageCircle, Pencil } from 'lucide-react';
import { Product } from '../lib/mockData';
import { Language, translate } from '../lib/i18n';
import { ReportDialog } from './ReportDialog';
import { Button } from './ui/button';
import { useAuth } from '../services/authContext';
import { favoriteService } from '../services/favoriteService';
import { dealService } from '../services/dealService';
import apiClient from '../services/api';
import { LocationPicker } from './LocationPicker';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { chatService } from '../services/chatService';
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
  onCompare?: (id: string) => void;
  isInComparison?: boolean;
}

export function ProductDetailPage({
  product,
  relatedProducts,
  language,
  onBack,
  onProductClick,
  onCompare,
  isInComparison = false,
}: ProductDetailPageProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [deal, setDeal] = useState<any>(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Check if product is favorited
  useEffect(() => {
    if (!user || !product.id) return;
    favoriteService.checkBatch([product.id]).then(result => {
      setIsFavorite(!!result[product.id]);
    }).catch(() => {});
  }, [user, product.id]);

  // Load deal status (public check for all users, detailed for logged-in)
  useEffect(() => {
    if (!product.id) return;
    // Public check
    apiClient.get(`/deals/product/${product.id}/status`).then(r => {
      if (r.data.inTransaction) {
        setDeal({ status: 'pending', notes: 'accepted' });
      }
    }).catch(() => {});
    // Detailed check for logged-in user
    if (user) {
      dealService.getDealForProduct(product.id).then(d => { if (d) setDeal(d); }).catch(() => {});
    }
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

  // 判断当前用户是否为该商品的卖家 / Check if current user is the seller of this product
  const isSeller = !!user && !!product.seller.id && user.userID === product.seller.id;

  /**
   * 买家点击"联系卖家"：创建或获取聊天房间后跳转
   * Buyer clicks "Contact Seller": create/get chat room then navigate
   */
  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await chatService.createOrGetChat(product.id, product.seller.id!);
      const chatID = res.data.data.chatID;
      // 传递来源路径，供 ChatPage 智能返回使用 / Pass source path for ChatPage smart back navigation
      navigate(`/chat/${chatID}`, { state: { from: location.pathname + location.search } });
    } catch (err: any) {
      // 后端返回 403 表示自聊天被拒绝 / Backend 403 means self-chat rejected
      const status = err?.response?.status;
      if (status === 403) {
        toast.error(err?.response?.data?.message || 'Cannot start a chat with yourself');
      } else {
        toast.error('Failed to open chat. Please try again.');
      }
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
                  ) : deal && deal.status === 'pending' && deal.notes === 'accepted' ? (
                    <Badge style={{ background: '#dbeafe', color: '#2563eb' }}>{t('inTransaction')}</Badge>
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
              {/* 卖家看到"编辑商品"，买家看到"联系卖家" / Seller sees "Edit Product", buyer sees "Contact Seller" */}
              {isSeller ? (
                <Button
                  className="w-full text-white hover:text-white hover:shadow-lg hover:scale-105 transition-all duration-200"
                  style={{ background: 'linear-gradient(to right, #22c55e, #0d9488)' }}
                  onClick={() => navigate(`/edit-product/${product.id}`)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('editProduct')}
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('contactSeller')}
                </Button>
              )}
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
              <Button
                variant="outline"
                className={`w-full ${isInComparison ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
                onClick={() => onCompare?.(product.id)}
              >
                <Scale className="w-4 h-4 mr-2" />
                {t('addToCompare')}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setReportOpen(true)}>
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

        {/* Map Location */}
        {(product as any).latitude && (product as any).longitude && (
          <div className="mb-8">
            <h3 className="font-semibold mb-3">{t('mapLocation') || 'Location'}</h3>
            <LocationPicker
              latitude={(product as any).latitude}
              longitude={(product as any).longitude}
              address={(product as any).address}
              readonly
              onChange={() => {}}
            />
          </div>
        )}

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

      {/* Report Dialog */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        language={language}
        reportType="product"
        targetId={product.id}
        targetName={getLocalizedTitle()}
      />
    </div>
  );
}
