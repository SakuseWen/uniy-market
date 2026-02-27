import { useState } from 'react';
import { ChevronLeft, Heart, Scale, Flag, MessageCircle } from 'lucide-react';
import { Product } from '../lib/mockData';
import { Language, translate } from '../lib/i18n';
import { Button } from './ui/button';
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
  const [isFavorite, setIsFavorite] = useState(false);

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
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('contactSeller')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsFavorite(!isFavorite)}
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
