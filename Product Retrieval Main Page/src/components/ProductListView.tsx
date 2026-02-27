import { Heart, MessageCircle, GitCompare, CheckCircle, MapPin, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Language, translate } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductListViewProps {
  product: Product;
  language: Language;
  onFavorite: (id: string) => void;
  onCompare: (id: string) => void;
  onContact: (sellerId: string) => void;
  isFavorited?: boolean;
}

export function ProductListView({
  product,
  language,
  onFavorite,
  onCompare,
  onContact,
  isFavorited = false,
}: ProductListViewProps) {
  const t = (key: any) => translate(language, key);

  const getTitle = () => {
    if (language === 'zh' && product.titleZh) return product.titleZh;
    if (language === 'th' && product.titleTh) return product.titleTh;
    return product.title;
  };

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(product.publishedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow flex gap-4">
      {/* Product Image */}
      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <ImageWithFallback
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {product.sold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs px-2 py-1 bg-red-600 rounded">SOLD</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title and Condition */}
            <div className="flex items-start gap-2 mb-2">
              <h3 className="flex-1 line-clamp-1">{getTitle()}</h3>
              <Badge variant="secondary" className="flex-shrink-0">
                {t(product.condition as any)}
              </Badge>
            </div>

            {/* Price and Badges */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-blue-600">${product.price}</span>
              {product.negotiable && (
                <Badge variant="outline" className="text-xs">
                  {t('negotiable')}
                </Badge>
              )}
              {product.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs">
                  {t(badge)}
                </Badge>
              ))}
            </div>

            {/* Seller and Location */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={product.seller.avatar} />
                  <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                </Avatar>
                <span>{product.seller.name}</span>
                {product.seller.verified && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
                <Badge variant="secondary" className="text-xs">
                  {t(product.seller.role)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{t(product.campus as any)}</span>
                {product.distance && <span>• {product.distance}</span>}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {product.views} {t('views')}
              </div>
              <span>{t('publishedOn')}: {product.publishedDate}</span>
              {product.avgMarketPrice && (
                <>
                  <span>{t('avgMarketPrice')}: ${product.avgMarketPrice}</span>
                  <span>{t('lowestRecentPrice')}: ${product.lowestRecentPrice}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="w-10 h-10 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(product.id);
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-10 h-10 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onCompare(product.id);
              }}
            >
              <GitCompare className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onContact(product.seller.id);
              }}
            >
              <MessageCircle className="w-3 h-3" />
              {t('contactSeller')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}