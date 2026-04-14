import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Header } from '../components/Header';
import { AvatarCropper } from '../components/AvatarCropper';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Edit2, Trash2, Loader2, Camera, GraduationCap, UserX, Heart, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { productService } from '../services';
import { useAuth } from '../services/authContext';
import apiClient from '../services/api';
import { chatService, ChatSummary } from '../services/chatService';
import { favoriteService } from '../services/favoriteService';
import { dealService } from '../services/dealService';
import { reviewService } from '../services/reviewService';
import { reportService } from '../services/reportService';
import { StarRating } from '../components/StarRating';
import { TranslateButton } from '../components/TranslateButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

interface UserProduct {
  listingID: string;
  title: string;
  price: number;
  condition: string;
  status: 'active' | 'sold' | 'inactive';
  images?: Array<{ imagePath: string }>;
  createdAt: string;
}

function MyPage() {
  const navigate = useNavigate();
  // 8.1: 通过 URL 查询参数持久化 Tab 状态 / Persist tab state via URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'my-products';

  const { user, isAuthenticated, isLoading, updateUser, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 8.3: 聊天历史真实数据状态 / Real chat history state
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState(false);

  // 8.4: 删除对话弹窗状态 / Delete chat dialog state
  const [deleteChatTarget, setDeleteChatTarget] = useState<string | null>(null);

  // Favorites state / 收藏状态
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Deals state / 交易状态
  const [deals, setDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Review state / 评价状态
  const [reviewDeal, setReviewDeal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);
  const [myAvgRating, setMyAvgRating] = useState(0);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Delete account state
  const [deleteStep, setDeleteStep] = useState<'closed' | 'notice' | 'verify'>('closed');

  // My reports state
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [sendingDeleteCode, setSendingDeleteCode] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Education verification state
  const [eduStep, setEduStep] = useState<'closed' | 'email' | 'code'>('closed');
  const [eduEmail, setEduEmail] = useState('');
  const [eduCode, setEduCode] = useState('');
  const [sendingEduCode, setSendingEduCode] = useState(false);
  const [verifyingEdu, setVerifyingEdu] = useState(false);

  // 8.1: Tab 切换处理 / Handle tab change — sync to URL
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Fetch user products
  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        setLoading(true);
        if (!user?.userID) throw new Error('User ID not found');
        const response = await productService.getUserProducts(user.userID, 1, 20, true);
        setProducts((response.data as any) || []);
      } catch (error: any) {
        console.error('Fetch products error:', error);
        toast.error(t('failedLoadYourProducts'));
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated && user?.userID) fetchUserProducts();
  }, [isAuthenticated, user?.userID]);

  // 8.3: 当切换到聊天历史 Tab 时加载真实对话列表 / Load real chats when chat-history tab is active
  useEffect(() => {
    if (activeTab !== 'chat-history' || !isAuthenticated) return;
    const fetchChats = async () => {
      setChatsLoading(true);
      setChatsError(false);
      try {
        const response = await chatService.getChats();
        const data = response.data?.data?.data ?? [];
        setChats(data);
      } catch (error: any) {
        console.error('Fetch chats error:', error);
        setChatsError(true);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, [activeTab, isAuthenticated]);

  // 交易列表持久化：Tab 激活时自动拉取，防止路由回退后数据丢失
  // Deal list persistence: auto-fetch when tab is active to prevent data loss on route back
  useEffect(() => {
    if (activeTab !== 'deals' || !isAuthenticated) return;
    loadDeals();
  }, [activeTab, isAuthenticated]);

  // 我的评价持久化：Tab 激活时自动拉取 / My reviews persistence: auto-fetch when tab is active
  useEffect(() => {
    if (activeTab !== 'my-reviews' || !isAuthenticated) return;
    loadMyReviews();
  }, [activeTab, isAuthenticated]);

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    setDeleting(true);
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((p: any) => p.listingID !== productId));
      toast.success(t('productDeleted'));
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Delete product error:', error);
      if (error.response?.status === 401) {
        toast.error(t('sessionExpired'));
        navigate('/login');
        return;
      }
      toast.error(t('failedDeleteProduct'));
    } finally {
      setDeleting(false);
    }
  };

  const handleLanguageChange = (lang: any) => setLanguage(lang);

  // 加载收藏列表 / Load favorites list
  const loadFavorites = async () => {
    if (!isAuthenticated) return;
    setLoadingFavorites(true);
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(data || []);
    } catch { /* 静默失败 / Fail silently */ }
    finally { setLoadingFavorites(false); }
  };

  // 加载交易列表 / Load deals list
  const loadDeals = async () => {
    if (!isAuthenticated) return;
    setLoadingDeals(true);
    try {
      const data = await dealService.getMyDeals();
      setDeals(data || []);
    } catch { /* 静默失败 / Fail silently */ }
    finally { setLoadingDeals(false); }
  };

  // 加载我的评价 / Load my reviews
  const loadMyReviews = async () => {
    if (!isAuthenticated || !user?.userID) return;
    setLoadingMyReviews(true);
    try {
      const reviews = await reviewService.getUserReviews(user.userID);
      const list = Array.isArray(reviews) ? reviews : (reviews?.reviews || []);
      setMyReviews(list);
      if (list.length > 0) {
        setMyAvgRating(list.reduce((sum: number, r: any) => sum + r.rating, 0) / list.length);
      }
    } catch { /* 静默失败 / Fail silently */ }
    finally { setLoadingMyReviews(false); }
  };

  // 加载我的举报 / Load my reports
  const loadMyReports = async () => {
    if (!isAuthenticated) return;
    setLoadingReports(true);
    try {
      const res = await reportService.getMyReports();
      setMyReports(res.data?.reports || []);
    } catch { /* silent */ }
    finally { setLoadingReports(false); }
  };

  // 提交评价 / Submit review
  const handleSubmitReview = async () => {
    if (!reviewDeal || !user?.userID) return;
    setSubmittingReview(true);
    try {
      // 确定被评价方：买家评卖家 / Determine target: buyer reviews seller
      const targetUserID = reviewDeal.sellerID === user.userID ? reviewDeal.buyerID : reviewDeal.sellerID;
      const reviewType = reviewDeal.sellerID === user.userID ? 'seller_to_buyer' : 'buyer_to_seller';
      await reviewService.submitReview({
        rating: reviewRating,
        comment: reviewComment,
        targetUserID,
        dealID: reviewDeal.dealID,
        reviewType,
      });
      toast.success(t('reviewSubmitted') || 'Review submitted');
      setReviewDeal(null);
      setReviewRating(5);
      setReviewComment('');
      setReviewImages([]);
      setReviewImagePreviews([]);
      loadDeals();
    } catch { toast.error(t('reviewFailed') || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await apiClient.put('/auth/profile', { name: editName, bio: editBio });
      updateUser(response.data.data.user);
      setIsEditing(false);
      toast.success(t('profileUpdated'));
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(t('profileUpdateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle avatar file selection - open cropper
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCropperImage(reader.result as string); setShowCropper(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle cropped avatar upload
  const handleCroppedAvatar = async (blob: Blob) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const response = await apiClient.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(response.data.data.user);
      toast.success(t('avatarUpdated'));
      setShowCropper(false);
      setCropperImage(null);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(t('avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Send delete account verification code
  const handleSendDeleteCode = async () => {
    setSendingDeleteCode(true);
    try {
      await apiClient.post('/auth/delete-account/send-code');
      toast.success(t('deleteCodeSent'));
      setDeleteStep('verify');
    } catch (error: any) {
      console.error('Send delete code error:', error);
      toast.error(t('deleteCodeFailed'));
    } finally {
      setSendingDeleteCode(false);
    }
  };

  // Confirm account deletion
  const handleConfirmDelete = async () => {
    if (deleteCode.length !== 6) return;
    setDeletingAccount(true);
    try {
      await apiClient.post('/auth/delete-account/confirm', { code: deleteCode });
      toast.success(t('accountDeleted'));
      setDeleteStep('closed');
      logout();
      navigate('/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(t('deleteVerifyFailed'));
    } finally {
      setDeletingAccount(false);
    }
  };

  // Send edu verification code
  const handleSendEduCode = async () => {
    if (!eduEmail.trim()) return;
    setSendingEduCode(true);
    try {
      await apiClient.post('/auth/edu-verify/send-code', { eduEmail });
      toast.success(t('eduCodeSent'));
      setEduStep('code');
    } catch (error: any) {
      if (error?.suspendedMessage) { toast.error(error.suspendedMessage); return; }
      const code = error.response?.data?.error?.code;
      if (code === 'NOT_EDU_EMAIL') toast.error(t('notEduEmail'));
      else if (code === 'ALREADY_EDU_VERIFIED') toast.error(t('alreadyEduVerified'));
      else if (code === 'EDU_EMAIL_ALREADY_USED') toast.error(t('eduEmailAlreadyUsed'));
      else toast.error(t('eduCodeFailed'));
    } finally {
      setSendingEduCode(false);
    }
  };

  // Confirm edu verification
  const handleConfirmEdu = async () => {
    if (eduCode.length !== 6) return;
    setVerifyingEdu(true);
    try {
      const response = await apiClient.post('/auth/edu-verify/confirm', { eduEmail, code: eduCode });
      updateUser(response.data.data.user);
      toast.success(t('eduVerifySuccess'));
      setEduStep('closed');
      setEduEmail('');
      setEduCode('');
    } catch (error: any) {
      if (error?.suspendedMessage) { toast.error(error.suspendedMessage); return; }
      const code = error.response?.data?.error?.code;
      if (code === 'EDU_EMAIL_ALREADY_USED') toast.error(t('eduEmailAlreadyUsed'));
      else toast.error(t('eduVerifyFailed'));
    } finally {
      setVerifyingEdu(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-blue-100 text-blue-800';
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getConditionLabel = (condition: string | undefined) => {
    if (!condition) return '';
    switch (condition) {
      case 'new': return t('new');
      case 'like_new': return t('likeNew');
      case 'used': return t('used');
      default: return condition;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    switch (status.toLowerCase()) {
      case 'active': return t('active');
      case 'inactive': return t('inactive');
      case 'sold': return t('sold');
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // 8.3: 判断对方用户信息 / Determine the other party based on buyer/seller role
  const getOtherParty = (chat: ChatSummary) => {
    const isBuyer = user?.userID === chat.buyerID;
    return {
      name: isBuyer ? chat.sellerName : chat.buyerName,
      image: isBuyer ? chat.sellerImage : chat.buyerImage,
    };
  };

  // 8.3: 格式化最后消息时间 / Format last message timestamp
  const formatLastTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ${t('mAgo')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${t('mAgo')}`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        unreadMessages={0}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToProducts')}
        </button>

        {/* Profile Header (Social Style) */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          {isEditing ? (
            /* Edit Mode */
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.profileImage ? `http://localhost:3000${user.profileImage}` : ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition-colors"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">{t('profileName')}</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">{t('profileBio')}</label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder={t('bioPlaceholder')}
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditName(user?.name || ''); setEditBio(user?.bio || ''); }}>
                  {t('cancelEdit')}
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600">
                  {savingProfile ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t('saving')}</> : t('saveProfile')}
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 flex-shrink-0">
                <AvatarImage src={user?.profileImage ? `http://localhost:3000${user.profileImage}` : ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center gap-1 flex-1">
                <p className="text-xl font-bold">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.email || ''}</p>
                {user?.bio && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(true); setEditName(user?.name || ''); setEditBio(user?.bio || ''); }} className="gap-1">
                  <Edit2 className="w-4 h-4" /> {t('editProfile')}
                </Button>
                {user?.eduVerified ? (
                  <Badge variant="secondary" className="gap-1 py-1.5 px-3">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">✓</span> {t('eduVerified')}
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                    if ((user as any)?.status === 'suspended') {
                      const lang = localStorage.getItem('preferredLanguage') as any || 'en';
                      const msgs: Record<string, string> = {
                        en: 'Your account has been suspended. You cannot perform this action. Please contact the administrator.',
                        zh: '您的账户已被暂停使用，无法执行此操作。请联系管理员。',
                        th: 'บัญชีของคุณถูกระงับ ไม่สามารถดำเนินการนี้ได้ กรุณาติดต่อผู้ดูแลระบบ',
                      };
                      toast.error(msgs[lang] || msgs.en);
                      return;
                    }
                    setEduStep('email');
                  }}>
                    <GraduationCap className="w-4 h-4" /> {t('eduVerification')}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteStep('notice')}>
                  <UserX className="w-4 h-4" /> {t('deleteAccount')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 8.1: Tabs — value 绑定到 URL 参数 / Tabs value bound to URL param */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full mb-4 flex overflow-x-auto flex-nowrap px-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            <TabsTrigger value="chat-history" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm">{t('chatHistory')}</TabsTrigger>
            <TabsTrigger value="my-products" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm">{t('myProducts')}</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" onClick={loadFavorites}>{t('favorites')}</TabsTrigger>
            <TabsTrigger value="deals" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" onClick={loadDeals}>{t('deals')}</TabsTrigger>
            <TabsTrigger value="my-reviews" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" onClick={loadMyReviews}>{t('myReviews')}</TabsTrigger>
            <TabsTrigger value="my-reports" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" onClick={loadMyReports}>{t('myReports') || 'My Reports'}</TabsTrigger>
          </TabsList>

          {/* 8.3: Chat History Tab — 真实数据 / Real chat data */}
          <TabsContent value="chat-history">
            {chatsLoading ? (
              /* 加载中 / Loading state */
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">{t('loadingYourProducts')}</span>
              </div>
            ) : chatsError ? (
              /* 加载失败 / Error state */
              <div className="text-center py-8 bg-white rounded-lg border">
                <p className="text-gray-500 mb-4">{t('networkError')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ tab: 'chat-history' })}
                >
                  {t('retry')}
                </Button>
              </div>
            ) : chats.length === 0 ? (
              /* 空状态 / Empty state */
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border">
                {t('chatHistory')} —
              </div>
            ) : (
              /* 对话列表 / Chat list */
              <div className="flex flex-col gap-2">
                {chats.map((chat) => {
                  const other = getOtherParty(chat);
                  const preview = (chat.productTitle || '').slice(0, 50);
                  return (
                    <div key={chat.chatID} className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50">
                      {/* 点击跳转聊天页 / Click to navigate to chat */}
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/chat/${chat.chatID}`)}
                      >
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={other.image ? `http://localhost:3000${other.image}` : ''} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {other.name ? other.name.substring(0, 2).toUpperCase() : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-semibold text-sm">{other.name}</p>
                            <span className="text-xs text-gray-400">{formatLastTime(chat.lastMessageAt)}</span>
                          </div>
                          {/* 商品名称 / Product title */}
                          <p className="text-xs text-blue-500 truncate mb-0.5">{chat.productTitle}</p>
                          {/* 最新消息预览（来自 lastMessageText，truncate 样式）/ Latest message preview (from lastMessageText, truncate style) */}
                          <p className="text-sm text-gray-500 truncate">{chat.lastMessageText ?? ''}</p>
                        </div>
                        {/* 未读数徽章（药丸状）/ Unread badge (pill shape) */}
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-2 min-w-[1.5rem] h-5 flex items-center justify-center rounded-full flex-shrink-0">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {/* 8.4: 删除按钮 / Delete button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteChatTarget(chat.chatID)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Products Tab */}
          <TabsContent value="my-products">
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('myProducts')}</CardTitle>
                    <CardDescription>{t('manageListings')}</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      if (!user?.eduVerified) { toast.error(t('eduRequiredToPost')); return; }
                      navigate('/create-product');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    + {t('createNewProduct')}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">{t('loadingYourProducts')}</span>
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('noProductsYet')}</h3>
                  <p className="text-gray-600 mb-6">{t('startSelling')}</p>
                  <Button
                    onClick={() => {
                      if (!user?.eduVerified) { toast.error(t('eduRequiredToPost')); return; }
                      navigate('/create-product');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    {t('createFirstProduct')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product: any) => (
                  <Card key={product.listingID} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={`http://localhost:3000${product.images[0].imagePath}`}
                              alt={product.title}
                              className="w-32 h-32 object-cover rounded-lg"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">{t('noImage')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{product.title}</h3>
                              <p className="text-2xl font-bold text-blue-600 mt-1">${product.price.toFixed(2)}</p>
                            </div>
                            <Badge className={getStatusColor(product.status)}>
                              {getStatusLabel(product.status)}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600 mb-4">
                            <span>{t('condition')}: {getConditionLabel(product.condition)}</span>
                            <span>{t('posted')}: {new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/edit-product/${product.listingID}`)} className="gap-2">
                              <Edit2 className="w-4 h-4" /> {t('edit')}
                            </Button>
                            {product.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-500 border-orange-200 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                                onClick={async () => {
                                  try {
                                    await productService.updateProduct(product.listingID, { status: 'inactive' });
                                    setProducts(products.map((p: any) =>
                                      p.listingID === product.listingID ? { ...p, status: 'inactive' } : p
                                    ));
                                    toast.success(t('productUnlisted'));
                                  } catch (err: any) {
                                    toast.error(t('failedUnlist'));
                                  }
                                }}
                              >
                                {t('unlist')}
                              </Button>
                            ) : product.status === 'inactive' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-500 border-green-200 hover:bg-green-100 hover:text-green-700 hover:border-green-300 hover:shadow-md transition-all duration-200"
                                onClick={async () => {
                                  try {
                                    await productService.updateProduct(product.listingID, { status: 'active' });
                                    setProducts(products.map((p: any) =>
                                      p.listingID === product.listingID ? { ...p, status: 'active' } : p
                                    ));
                                    toast.success(t('productRelisted'));
                                  } catch (err: any) {
                                    toast.error(t('failedRelist'));
                                  }
                                }}
                              >
                                {t('relist')}
                              </Button>
                            ) : null}
                            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(product.listingID)} className="gap-2">
                              <Trash2 className="w-4 h-4" /> {t('delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            {loadingFavorites ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : favorites.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  {t('noFavorites') || 'No favorites yet'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {favorites.map((fav: any) => (
                  <Card key={fav.favID} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/product/${fav.listingID}`)}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {fav.images && fav.images.length > 0 ? (
                            <img
                              src={`http://localhost:3000${fav.images[0].imagePath}`}
                              alt={fav.title}
                              className="w-32 h-32 object-cover rounded-lg"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">{t('noImage')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{fav.title}</h3>
                          <p className="text-lg font-bold text-blue-600 mt-1">${fav.price?.toFixed(2)}</p>
                          <span className="text-sm text-gray-500">{fav.condition === 'new' ? t('new') : fav.condition === 'like_new' ? t('ninetyNew') : t('eightyNew')}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 self-center"
                          onClick={async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            try {
                              await favoriteService.removeFavorite(fav.listingID);
                              setFavorites(prev => prev.filter(f => f.favID !== fav.favID));
                              toast.success(t('removedFromFavorites'));
                            } catch (err) {
                              console.error('Remove favorite error:', err);
                            }
                          }}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500 mr-1" />
                          {t('unfavorite') || 'Remove'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            {loadingDeals ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : deals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  {t('noDeals') || 'No deals yet'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {deals.map((deal: any) => {
                  const isSeller = deal.sellerID === user?.userID;
                  const isPending = deal.status === 'pending' && !deal.notes;
                  const isAccepted = deal.status === 'pending' && deal.notes === 'accepted';
                  const isCompleted = deal.status === 'completed';
                  const isCancelled = deal.status === 'cancelled';
                  return (
                    <Card key={deal.dealID}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            {deal.images && deal.images.length > 0 ? (
                              <img
                                src={`http://localhost:3000${deal.images[0].imagePath}`}
                                alt={deal.title}
                                className="w-32 h-32 object-cover rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400">{t('noImage')}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{deal.title || deal.listingID}</h3>
                              <Badge variant="secondary" style={{
                            background: isCompleted ? '#dcfce7' : isCancelled ? '#fee2e2' : isAccepted ? '#dbeafe' : '#fef3c7',
                            color: isCompleted ? '#16a34a' : isCancelled ? '#dc2626' : isAccepted ? '#2563eb' : '#d97706'
                          }}>
                            {isCompleted ? t('dealCompleted') : isCancelled ? (t('dealCancelled') || 'Cancelled') : isAccepted ? (t('inTransaction') || 'In Transaction') : (t('waitingSellerAccept') || 'Pending')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {isSeller ? (t('asSeller')) : (t('asBuyer'))} · ${deal.finalPrice?.toFixed(2) || '0.00'}
                        </p>
                        {isSeller && deal.buyerName && (
                          <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/seller/${deal.buyerID}`); }}>
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={deal.buyerProfileImage?.startsWith('/') ? `http://localhost:3000${deal.buyerProfileImage}` : ''} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">{deal.buyerName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-blue-600 hover:underline font-medium">{t('buyer')}: {deal.buyerName}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {/* Seller: accept/reject pending */}
                          {isSeller && isPending && (
                            <>
                              <Button size="sm" className="text-white" style={{ background: '#16a34a' }} onClick={async () => {
                                try {
                                  await dealService.acceptDeal(deal.dealID);
                                  toast.success(t('dealAccepted'));
                                  loadDeals();
                                } catch (err: any) { toast.error(err?.suspendedMessage || err.response?.data?.error?.message || 'Failed'); }
                              }}><Check className="w-3 h-3 mr-1" />{t('acceptDeal')}</Button>
                              <Button size="sm" className="text-white" style={{ background: '#dc2626' }} onClick={async () => {
                                try {
                                  await dealService.rejectDeal(deal.dealID);
                                  toast.success(t('dealRejected'));
                                  loadDeals();
                                } catch (err: any) { toast.error(err?.suspendedMessage || err.response?.data?.error?.message || 'Failed'); }
                              }}><XIcon className="w-3 h-3 mr-1" />{t('rejectDeal')}</Button>
                            </>
                          )}
                          {/* Both: confirm/cancel in-transaction */}
                          {isAccepted && (
                            <>
                              <Button size="sm" className="text-white" style={{ background: '#16a34a' }} disabled={isSeller ? deal.sellerConfirmed : deal.buyerConfirmed} onClick={async () => {
                                try {
                                  const res = await dealService.confirmDeal(deal.dealID);
                                  toast.success(res.completed ? t('dealCompleted') : t('dealConfirmedWaiting'));
                                  loadDeals();
                                } catch (err: any) { toast.error(err?.suspendedMessage || err.response?.data?.error?.message || 'Failed'); }
                              }}><Check className="w-3 h-3 mr-1" />{(isSeller ? deal.sellerConfirmed : deal.buyerConfirmed) ? t('confirmed') : t('confirmDeal')}</Button>
                              <Button size="sm" variant="outline" style={{ color: '#dc2626' }} onClick={async () => {
                                try {
                                  await dealService.cancelDeal(deal.dealID);
                                  toast.success(t('dealCancelled'));
                                  loadDeals();
                                } catch (err: any) { toast.error(err?.suspendedMessage || err.response?.data?.error?.message || 'Failed'); }
                              }}><XIcon className="w-3 h-3 mr-1" />{t('cancelDeal')}</Button>
                            </>
                          )}
                          {/* Buyer waiting */}
                          {!isSeller && isPending && (
                            <span className="text-sm" style={{ color: '#d97706' }}>{t('waitingSellerAccept')}</span>
                          )}
                          {/* Delete completed/cancelled deals */}
                          {isCompleted && !deal.reviewed && (
                            <Button size="sm" className="text-white" style={{ background: '#f59e0b' }} onClick={() => { setReviewDeal(deal); setReviewRating(5); setReviewComment(''); setReviewImages([]); setReviewImagePreviews([]); }}>
                              ⭐ {t('leaveReview')}
                            </Button>
                          )}
                          {isCompleted && deal.reviewed && (
                            <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>✓ {t('reviewed') || 'Reviewed'}</span>
                          )}
                          {(isCompleted || isCancelled) && (
                            <Button size="sm" variant="outline" style={{ color: '#dc2626' }} onClick={async () => {
                              try {
                                await dealService.deleteDeal(deal.dealID);
                                loadDeals();
                              } catch (err: any) { toast.error(err?.suspendedMessage || err.response?.data?.error?.message || 'Failed'); }
                            }}><Trash2 className="w-3 h-3 mr-1" />{t('delete')}</Button>
                          )}
                        </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Reviews Tab */}
          <TabsContent value="my-reviews">
            {loadingMyReviews ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4 p-4 bg-white rounded-lg border">
                  <StarRating rating={myAvgRating} size={20} />
                  <span className="font-semibold">{myAvgRating.toFixed(1)} / 5</span>
                  <span className="text-sm text-gray-500">({myReviews.length} {t('reviews')})</span>
                </div>
                {myReviews.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-gray-400">{t('noReviews')}</CardContent></Card>
                ) : (
                  <div className="grid gap-4">
                    {myReviews.map((review: any) => (
                      <Card key={review.reviewID}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={review.reviewerProfileImage?.startsWith('/') ? `http://localhost:3000${review.reviewerProfileImage}` : ''} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">{review.reviewerName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{review.reviewerName}</span>
                                <StarRating rating={review.rating} size={14} />
                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                              {review.comment && <p className="text-base sm:text-sm text-gray-700 break-all">{review.comment}</p>}
                              {/* 评价翻译按钮 / Review translate button */}
                              {review.comment && (
                                <TranslateButton text={review.comment} language={language} />
                              )}
                              {review.images && review.images.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-2">
                                  {review.images.map((img: any) => (
                                    <img key={img.imageID} src={`http://localhost:3000${img.imagePath}`} alt="" className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-md" />
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
            )}
          </TabsContent>

          {/* My Reports Tab */}
          <TabsContent value="my-reports">
            {loadingReports ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : myReports.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border">
                {t('noReports') || 'No reports submitted yet'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myReports.map((report: any) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    under_review: 'bg-blue-100 text-blue-800',
                    resolved: 'bg-green-100 text-green-800',
                    dismissed: 'bg-gray-100 text-gray-600',
                  };
                  const images = report.evidence_images ? JSON.parse(report.evidence_images) : [];
                  return (
                    <Card key={report.report_id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <Badge variant="outline" className="mr-2">{t(report.report_type) || report.report_type}</Badge>
                            <Badge variant="outline">{t(report.category) || report.category.replace(/_/g, ' ')}</Badge>
                          </div>
                          <Badge className={statusColors[report.status] || 'bg-gray-100'}>
                            {t(report.status) || report.status}
                          </Badge>
                        </div>
                        <p className="text-base sm:text-sm text-gray-700 mb-2 break-all">{report.reason}</p>
                        {images.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-2">
                            {images.map((img: string, i: number) => (
                              <img key={i} src={`http://localhost:3000${img}`} alt="" className="w-24 h-24 sm:w-16 sm:h-16 object-cover rounded-md border" />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</p>
                        {report.admin_notes && (
                          <p className="text-xs text-blue-600 mt-1">{t('adminNotes') || 'Admin notes'}: {report.admin_notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewDeal} onOpenChange={(v: boolean) => { if (!v) setReviewDeal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('leaveReview') || 'Leave a Review'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('rating') || 'Rating'}</p>
              <StarRating rating={reviewRating} size={28} interactive onChange={setReviewRating} />
              <p className="text-sm text-gray-400 mt-1">{reviewRating} / 5</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('reviewComment') || 'Comment'}</p>
              <Textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder={t('writeReview')} rows={4} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('reviewImages')}</p>
              <div
                className="flex gap-2 flex-wrap p-3 rounded-lg transition-colors"
                style={{ border: '2px dashed #d1d5db', minHeight: 80 }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = ''; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '';
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  files.slice(0, 3 - reviewImages.length).forEach(file => {
                    setReviewImages(prev => [...prev, file]);
                    const reader = new FileReader();
                    reader.onloadend = () => setReviewImagePreviews(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }}
              >
                {reviewImagePreviews.map((p, i) => (
                  <div key={i} className="relative" style={{ width: 60, height: 60 }}>
                    <img src={p} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                    <button style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 12, border: 'none', cursor: 'pointer' }} onClick={() => {
                      setReviewImages(prev => prev.filter((_, idx) => idx !== i));
                      setReviewImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                    }}>×</button>
                  </div>
                ))}
                {reviewImages.length < 3 && (
                  <label style={{ width: 60, height: 60, border: '2px dashed #d1d5db', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>
                    +
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setReviewImages(prev => [...prev, file]);
                      const reader = new FileReader();
                      reader.onloadend = () => setReviewImagePreviews(prev => [...prev, reader.result as string]);
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} />
                  </label>
                )}
                {reviewImages.length === 0 && (
                  <p className="text-xs text-gray-400 self-center ml-2">{t('dragDropImages')}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDeal(null)}>{t('cancel')}</Button>
              <Button className="text-white" style={{ background: '#f59e0b' }} onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {t('submitReview') || 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Cropper Dialog */}
      {cropperImage && (
        <AvatarCropper
          imageSrc={cropperImage}
          open={showCropper}
          onClose={() => { setShowCropper(false); setCropperImage(null); }}
          onCropComplete={handleCroppedAvatar}
          saving={uploadingAvatar}
          labels={{
            title: t('changeAvatar'),
            zoom: t('zoom') || 'Zoom',
            cancel: t('cancelEdit'),
            save: t('saveProfile'),
            saving: t('saving'),
          }}
        />
      )}

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open: any) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProduct')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteProductConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteProduct(deleteConfirm)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('deleting')}</> : t('delete')}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 8.4: 删除对话三选项弹窗 / Delete chat dialog with three options */}
      <Dialog open={!!deleteChatTarget} onOpenChange={(v: boolean) => { if (!v) setDeleteChatTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete')} {t('chatHistory')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            {/* 选项1: 隐藏/关闭 / Option 1: Hide/close */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                const chatId = deleteChatTarget!;
                setDeleteChatTarget(null);
                try {
                  await chatService.hideChat(chatId);
                  setChats((prev) => prev.filter((c) => c.chatID !== chatId));
                  toast.success(t('productUnlisted')); // reuse "unlisted" success key
                } catch (err) {
                  toast.error(t('networkError'));
                }
              }}
            >
              {/* 隐藏对话（软删除）/ Hide chat (soft delete) */}
              🙈 {language === 'zh' ? '隐藏对话' : language === 'th' ? 'ซ่อนการสนทนา' : 'Hide Chat'}
            </Button>

            {/* 选项2: 永久删除 / Option 2: Hard delete */}
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={async () => {
                const chatId = deleteChatTarget!;
                // 二次确认 / Secondary confirmation
                const confirmed = window.confirm(
                  language === 'zh'
                    ? '确定要永久删除此对话吗？所有消息将被清除，无法恢复。'
                    : language === 'th'
                    ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสนทนานี้อย่างถาวร?'
                    : 'Permanently delete this chat? All messages will be removed and cannot be recovered.'
                );
                if (!confirmed) return;
                setDeleteChatTarget(null);
                try {
                  await chatService.hardDeleteChat(chatId);
                  setChats((prev) => prev.filter((c) => c.chatID !== chatId));
                  toast.success(t('productDeleted')); // reuse "deleted" success key
                } catch (err) {
                  toast.error(t('networkError'));
                }
              }}
            >
              {/* 永久删除 / Permanently delete */}
              🗑️ {language === 'zh' ? '永久删除' : language === 'th' ? 'ลบถาวร' : 'Delete Permanently'}
            </Button>

            {/* 选项3: 取消 / Option 3: Cancel */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setDeleteChatTarget(null)}
            >
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteStep !== 'closed'} onOpenChange={(v: boolean) => { if (!v) { setDeleteStep('closed'); setDeleteCode(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('deleteAccountNotice')}</DialogTitle>
          </DialogHeader>
          {deleteStep === 'notice' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{t('deleteAccountWarning')}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span>{t('deleteAccountConsequence1')}</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span>{t('deleteAccountConsequence2')}</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span>{t('deleteAccountConsequence3')}</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span>{t('deleteAccountConsequence4')}</li>
              </ul>
              <p className="text-sm text-gray-500">{t('deleteAccountConfirmPrompt')}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDeleteStep('closed'); setDeleteCode(''); }}>
                  {t('cancelDelete')}
                </Button>
                <Button size="sm" variant="destructive" onClick={handleSendDeleteCode} disabled={sendingDeleteCode}>
                  {sendingDeleteCode ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t('sendingDeleteCode')}</> : t('proceedDelete')}
                </Button>
              </div>
            </div>
          )}
          {deleteStep === 'verify' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('enterDeleteCode')}</p>
              <Input
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDeleteStep('closed'); setDeleteCode(''); }}>
                  {t('cancelDelete')}
                </Button>
                <Button size="sm" variant="destructive" onClick={handleConfirmDelete} disabled={deletingAccount || deleteCode.length !== 6}>
                  {deletingAccount ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t('deletingAccount')}</> : t('confirmDelete')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Education Verification Dialog */}
      <Dialog open={eduStep !== 'closed'} onOpenChange={(v: boolean) => { if (!v) { setEduStep('closed'); setEduEmail(''); setEduCode(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              {t('eduVerification')}
            </DialogTitle>
          </DialogHeader>
          {eduStep === 'email' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('eduVerifyDesc')}</p>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{t('eduEmailLabel')}</label>
                <Input value={eduEmail} onChange={(e) => setEduEmail(e.target.value)} placeholder={t('eduEmailPlaceholder')} type="email" />
              </div>
              <p className="text-xs text-gray-400">{t('eduEmailHint')}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setEduStep('closed'); setEduEmail(''); }}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSendEduCode} disabled={sendingEduCode || !eduEmail.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600">
                  {sendingEduCode ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t('sendingCode')}</> : t('sendEduCode')}
                </Button>
              </div>
            </div>
          )}
          {eduStep === 'code' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('eduEnterCode')}</p>
              <Input
                value={eduCode}
                onChange={(e) => setEduCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setEduStep('closed'); setEduEmail(''); setEduCode(''); }}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleConfirmEdu} disabled={verifyingEdu || eduCode.length !== 6}
                  className="bg-gradient-to-r from-blue-500 to-purple-600">
                  {verifyingEdu ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t('verifying')}</> : t('verify')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyPage;
