import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router';
import { Header } from '../components/Header';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ArrowLeft, GraduationCap, Loader2, MessageCircle } from 'lucide-react';
import { productService } from '../services';
import apiClient from '../services/api';
import { reviewService } from '../services/reviewService';
import { StarRating } from '../components/StarRating';
import { TranslateButton } from '../components/TranslateButton';
import { chatService } from '../services/chatService';
import { toast } from 'sonner';

interface SellerInfo {
  userID: string;
  name: string;
  profileImage?: string;
  bio?: string;
  eduVerified?: boolean;
  createdAt?: string;
}

interface SellerProduct {
  listingID: string;
  title: string;
  price: number;
  condition: string;
  status: string;
  images?: Array<{ imagePath: string }>;
  createdAt: string;
}

export default function SellerProfilePage() {
  const navigate = useNavigate();
  const { sellerId } = useParams<{ sellerId: string }>();
  const location = useLocation();
  // 从 URL query 读取 listingID（从商品详情页跳转时携带）
  // Read listingID from URL query (passed when navigating from product detail page)
  const [searchParams] = useSearchParams();
  const listingIdFromQuery = searchParams.get('listingID');

  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(5);
  const [reviewCount, setReviewCount] = useState(0);
  const [contactingProductId, setContactingProductId] = useState<string | null>(null);
  // 顶部"发送消息"按钮的 loading 状态 / Loading state for top "Send Message" button
  const [sendingMessage, setSendingMessage] = useState(false);

  // 点击商品的"联系卖家"按钮 / Click product's "Contact Seller" button
  const handleContactForProduct = async (listingID: string) => {
    if (!sellerId) return;
    setContactingProductId(listingID);
    try {
      const res = await chatService.createOrGetChat(listingID, sellerId);
      const chatID = res.data.data?.chatID;
      if (chatID) navigate(`/chat/${chatID}`, { state: { from: location.pathname + location.search } });
    } catch {
      toast.error(language === 'zh' ? '发起对话失败，请稍后重试' : 'Failed to start chat');
    } finally {
      setContactingProductId(null);
    }
  };

  /**
   * 顶部"发送消息"按钮逻辑：
   * 1. 若 URL 携带 listingID → 直接 createOrGetChat 跳转
   * 2. 若无 listingID → 使用卖家第一个在售商品，或提示用户从商品页发起
   *
   * Top "Send Message" button logic:
   * 1. If URL has listingID → createOrGetChat and navigate
   * 2. If no listingID → use seller's first active product, or show hint
   */
  const handleSendMessage = async () => {
    if (!sellerId) return;
    setSendingMessage(true);
    try {
      // 优先使用 URL 携带的 listingID，其次用卖家第一个在售商品
      // Prefer listingID from URL, fallback to seller's first active product
      const targetListingID = listingIdFromQuery || products[0]?.listingID;
      if (!targetListingID) {
        toast.error(
          language === 'zh'
            ? '请先从商品页发起对话'
            : language === 'th'
            ? 'กรุณาเริ่มการสนทนาจากหน้าสินค้า'
            : 'Please start a conversation from a product page'
        );
        return;
      }
      const res = await chatService.createOrGetChat(targetListingID, sellerId);
      const chatID = res.data.data?.chatID;
      if (chatID) navigate(`/chat/${chatID}`, { state: { from: location.pathname + location.search } });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error(
          language === 'zh' ? '不能与自己发起对话' : 'Cannot start a chat with yourself'
        );
      } else {
        toast.error(language === 'zh' ? '发起对话失败，请稍后重试' : 'Failed to start chat');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      try {
        setLoading(true);
        const [profileRes, productsRes] = await Promise.all([
          apiClient.get(`/products/seller/${sellerId}/profile`),
          apiClient.get(`/products/seller/${sellerId}?page=1&limit=50`),
        ]);
        setSeller(profileRes.data.data.user);
        const items = productsRes.data.data?.data || productsRes.data.data || [];
        setProducts(Array.isArray(items) ? items.filter((p: any) => p.status === 'active') : []);
        // Fetch reviews
        try {
          const reviewData = await reviewService.getUserReviews(sellerId);
          setReviews(reviewData?.reviews || []);
          const stats = reviewData?.statistics?.overall;
          setAvgRating(stats?.count > 0 ? stats.average : 5);
          setReviewCount(stats?.count || 0);
        } catch (_e) {}
      } catch (error) {
        console.error('Failed to load seller profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sellerId]);

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return t('new');
      case 'like_new': return t('ninetyNew');
      case 'used': return t('eightyNew');
      default: return condition;
    }
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

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} unreadMessages={0} />
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          {t('userNotFound') || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} unreadMessages={0} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t('back') || 'Back'}
        </button>

        {/* Seller Profile Card */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarImage src={seller.profileImage ? `http://localhost:3000${seller.profileImage}` : ''} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                {seller.name ? seller.name.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xl font-bold">{seller.name}</p>
              {seller.bio && <p className="text-sm text-gray-600 mt-1">{seller.bio}</p>}
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={avgRating} size={16} />
                <span className="text-sm text-gray-500">{avgRating.toFixed(1)} ({reviewCount})</span>
                {seller.eduVerified && (
                  <Badge variant="secondary" className="gap-1 py-1 px-2">
                    <GraduationCap className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 text-xs">✓</span> {t('eduVerified')}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
              disabled={sendingMessage}
              onClick={handleSendMessage}
            >
              {sendingMessage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {t('message')}
            </Button>
          </div>
        </div>

        {/* Products */}
        <Card>
          <CardContent className="py-4">
            <p className="text-lg font-bold text-center">{t('sellerProducts') || 'Products'} ({products.length})</p>
          </CardContent>
        </Card>

        {products.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-gray-400">
              {t('noProductsYet')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 mt-4">
            {products.map((product) => (
              <Card key={product.listingID} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/product/${product.listingID}`)}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={`http://localhost:3000${product.images[0].imagePath}`}
                          alt={product.title}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ width: 100, height: 100, borderRadius: 8 }} className="bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">{t('noImage')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.title}</h3>
                      <p className="text-lg font-bold text-blue-600 mt-1">${product.price.toFixed(2)}</p>
                      <div className="flex gap-3 text-sm text-gray-500 mt-1">
                        <span>{t('condition')}: {getConditionLabel(product.condition)}</span>
                        <span>{t('posted')}: {new Date(product.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reviews Section */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <p className="text-lg font-bold text-center mb-4">{t('reviews') || 'Reviews'} ({reviews.length})</p>
          </CardContent>
        </Card>
        {reviews.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-gray-400">
              {t('noReviews') || 'No reviews yet'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 mt-4">
            {reviews.map((review: any) => (
              <Card key={review.reviewID}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={review.reviewerProfileImage?.startsWith('/') ? `http://localhost:3000${review.reviewerProfileImage}` : ''} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {review.reviewerName?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{review.reviewerName}</span>
                        <StarRating rating={review.rating} size={14} />
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                      {/* 评价翻译按钮 / Review translate button */}
                      {review.comment && (
                        <TranslateButton text={review.comment} language={language} />
                      )}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.images.map((img: any) => (
                            <img key={img.imageID} src={`http://localhost:3000${img.imagePath}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
