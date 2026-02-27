import { MessageCircle, Star, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Language, translate } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { useNavigate } from 'react-router';

interface SellerInfoCardProps {
  seller: Product['seller'];
  language: Language;
}

export function SellerInfoCard({ seller, language }: SellerInfoCardProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sellerInformation')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-16 h-16">
            <AvatarImage src={seller.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {seller.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Seller Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span>{seller.name}</span>
              {seller.verified && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant={seller.role === 'student' ? 'secondary' : 'default'}>
                {t(seller.role)}
              </Badge>
              {seller.verified && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {t('campusEmailVerified')}
                </span>
              )}
            </div>

            {/* Rating and Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-gray-500">{t('rating')}</div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{seller.rating.toFixed(1)} / 5</span>
                </div>
              </div>

              {seller.totalTrades !== undefined && (
                <div>
                  <div className="text-gray-500">Trades</div>
                  <div>{seller.totalTrades} {t('successfulTrades')}</div>
                </div>
              )}

              {seller.responseTime && (
                <div>
                  <div className="text-gray-500">{t('responseTime')}</div>
                  <div>
                    {t('usuallyReplies')} {seller.responseTime}
                  </div>
                </div>
              )}

              {seller.joinDate && (
                <div>
                  <div className="text-gray-500">{t('joinDate')}</div>
                  <div>{seller.joinDate}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={() => navigate(`/chat/${seller.id}`)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('message')}
              </Button>
              <Button variant="outline">{t('viewSellerProfile')}</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}