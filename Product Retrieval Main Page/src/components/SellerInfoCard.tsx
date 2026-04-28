import { MessageCircle, Star, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Language, translate } from '../lib/i18n';
import { Product } from '../lib/mockData';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../services/authContext';
import { chatService } from '../services/chatService';
import { toast } from 'sonner';

interface SellerInfoCardProps {
  seller: Product['seller'];
  language: Language;
  listingId?: string;
}

export function SellerInfoCard({ seller, language, listingId }: SellerInfoCardProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sendingMessage, setSendingMessage] = useState(false);

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
                  <div className="text-gray-500">{t('successfulTrades')}</div>
                  <div>{seller.totalTrades}</div>
                </div>
              )}

              {seller.joinDate && (
                <div>
                  <div className="text-gray-500">{t('joinDate')}</div>
                  <div>{new Date(seller.joinDate).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' })}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
                disabled={sendingMessage}
                onClick={async () => {
                  if (!user) { navigate('/login'); return; }
                  if (!seller.id || !listingId) return;
                  setSendingMessage(true);
                  try {
                    const res = await chatService.createOrGetChat(listingId, seller.id);
                    const chatID = res.data.data?.chatID;
                    if (chatID) navigate(`/chat/${chatID}`, { state: { from: location.pathname } });
                  } catch (err: any) {
                    toast.error(err?.friendlyMessage || err?.suspendedMessage || err?.response?.data?.error?.message || 'Failed to open chat');
                  } finally {
                    setSendingMessage(false);
                  }
                }}
              >
                {sendingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                {t('message')}
              </Button>
              <Button variant="outline" onClick={() => {
                if (seller.id && user && seller.id === user.userID) {
                  navigate('/my-page');
                } else if (seller.id) {
                  navigate(`/seller/${seller.id}`);
                }
              }}>{t('viewSellerProfile')}</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}