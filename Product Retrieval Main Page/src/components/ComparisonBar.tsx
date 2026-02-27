import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Language, translate } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useState } from 'react';

interface ComparisonBarProps {
  language: Language;
  selectedProducts: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ComparisonBar({
  language,
  selectedProducts,
  onRemove,
  onClear,
}: ComparisonBarProps) {
  const t = (key: any) => translate(language, key);
  const [showComparison, setShowComparison] = useState(false);

  if (selectedProducts.length === 0) return null;

  const getTitle = (product: Product) => {
    if (language === 'zh' && product.titleZh) return product.titleZh;
    if (language === 'th' && product.titleTh) return product.titleTh;
    return product.title;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span>
                  {t('selectedItems')}: {selectedProducts.length}/4
                </span>
                <Button variant="ghost" size="sm" onClick={onClear}>
                  Clear All
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedProducts.map((product) => {
                  const daysAgo = Math.floor(
                    (new Date().getTime() - new Date(product.publishedDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 pr-3 min-w-[200px]"
                    >
                      <ImageWithFallback
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{getTitle(product)}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-blue-600">${product.price}</span>
                          <span>•</span>
                          <span>{t(product.condition as any)}</span>
                          <span>•</span>
                          <span>
                            {daysAgo} {t('postedDaysAgo')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(product.id)}
                        className="flex-shrink-0 hover:bg-gray-200 rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0"
              onClick={() => setShowComparison(true)}
              disabled={selectedProducts.length < 2}
            >
              {t('compareNow')}
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('compareNow')}</DialogTitle>
            <DialogDescription>Compare up to 4 products side by side</DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left sticky left-0 bg-white">Feature</th>
                  {selectedProducts.map((product) => (
                    <th key={product.id} className="p-3 text-left min-w-[200px]">
                      <div className="space-y-2">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.title}
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="text-sm">{getTitle(product)}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">{t('price')}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      <span className="text-blue-600">${product.price}</span>
                      {product.negotiable && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {t('negotiable')}
                        </Badge>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">{t('condition')}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      {t(product.condition as any)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">{t('campus')}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      {t(product.campus as any)}
                      {product.distance && <span className="text-gray-500 ml-2">({product.distance})</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">{t('sellerTrust')}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      <div>
                        <p>{product.seller.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {t(product.seller.role)}
                          </Badge>
                          {product.seller.verified && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              {t('verified')}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-600">★ {product.seller.rating}</span>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">{t('deliveryType')}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {product.deliveryType.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {t(type)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 sticky left-0 bg-white">Extras</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {product.badges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="text-xs">
                            {t(badge)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 sticky left-0 bg-white">Action</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-3">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                        {t('contactSeller')}
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
