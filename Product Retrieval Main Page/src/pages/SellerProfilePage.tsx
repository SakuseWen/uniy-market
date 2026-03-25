import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
              onClick={() => navigate(`/chat/${sellerId}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('message')}
            </Button>
          </div>
        </div>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sellerProducts') || 'Products'} ({products.length})</CardTitle>
          </CardHeader>
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
      </div>
    </div>
  );
}
