import { Heart, MessageCircle, GitCompare, CheckCircle, MapPin, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Language, translate } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  language: Language;
  onFavorite: (id: string) => void;
  onCompare: (id: string) => void;
  onContact: (sellerId: string) => void;
  isFavorited?: boolean;
  isInComparison?: boolean;
}

export function ProductCard({
  product,
  language,
  onFavorite,
  onCompare,
  onContact,
  isFavorited = false,
  isInComparison = false,
}: ProductCardProps) {
  const t = (key: any) => translate(language, key);
  const [showTranslation, setShowTranslation] = useState(false);

  const getTitle = () => {
    if (showTranslation || language === 'en') return product.title;
    if (language === 'zh' && product.titleZh) return product.titleZh;
    if (language === 'th' && product.titleTh) return product.titleTh;
    return product.title;
  };

  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(product.publishedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Condition Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur">
            {t(product.condition as any)}
          </Badge>
        </div>

        {/* Sold Overlay */}
        {product.sold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white px-4 py-2 bg-red-600 rounded">SOLD</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="line-clamp-2 mb-2 min-h-[3em]">
          {getTitle()}
        </h3>

        {/* Machine Translation Toggle */}
        {language !== 'en' && (product.titleZh || product.titleTh) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTranslation(!showTranslation);
            }}
            className="text-xs text-blue-600 hover:underline mb-2"
          >
            {showTranslation ? product.title : t('machineTranslation')}
          </button>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-blue-600">${product.price}</span>
          {product.negotiable && (
            <Badge variant="outline" className="text-xs">
              {t('negotiable')}
            </Badge>
          )}
        </div>

        {/* Location & Distance */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
          <MapPin className="w-3 h-3" />
          <span>{t(product.campus as any)}</span>
          {product.distance && <span>• {product.distance}</span>}
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b">
          <Avatar className="w-6 h-6">
            <AvatarImage src={product.seller.avatar} />
            <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-700">{product.seller.name}</span>
            {product.seller.verified && (
              <CheckCircle className="w-3 h-3 text-green-600" />
            )}
          </div>
          <Badge variant="secondary" className="text-xs ml-auto">
            {t(product.seller.role)}
          </Badge>
        </div>

        {/* Product Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.badges.map((badge) => (
            <Badge key={badge} variant="outline" className="text-xs">
              {t(badge)}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-500 mb-3">
          {product.views} {t('views')} • {daysAgo} {t('postedDaysAgo')}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 hover:bg-gray-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCompare(product.id);
            }}
          >
            <GitCompare className="w-3 h-3" />
            {t('compare')}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
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
  );
}