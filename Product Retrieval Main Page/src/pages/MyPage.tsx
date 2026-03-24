import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { productService } from '../services';
import { useAuth } from '../services/authContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

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
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVerified] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch user products
  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        setLoading(true);
        if (!user?.userID) {
          throw new Error('User ID not found');
        }
        const response = await productService.getUserProducts(user.userID, 1, 20, true);
        setProducts((response.data as any) || []);
      } catch (error: any) {
        console.error('Fetch products error:', error);
        toast.error('Failed to load your products');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.userID) {
      fetchUserProducts();
    }
  }, [isAuthenticated, user?.userID]);

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    setDeleting(true);
    try {
      await productService.deleteProduct(productId);
      const updatedProducts = products.filter((p: any) => p.listingID !== productId);
      setProducts(updatedProducts);
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Delete product error:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please login again.');
        navigate('/login');
        return;
      }
      toast.error(error.response?.data?.error?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleLanguageChange = (lang: any) => {
    setLanguage(lang);
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
    if (!condition) return 'Unknown';
    switch (condition) {
      case 'new': return 'New';
      case 'like_new': return 'Like New';
      case 'used': return 'Used';
      default: return condition;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    switch (status.toLowerCase()) {
      case 'active': return t('active');
      case 'inactive': return t('inactive');
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        userVerified={userVerified}
        unreadMessages={0}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Profile Header (Social Style) */}
        <div className="bg-white rounded-xl border p-6 mb-6 flex items-center gap-6">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center gap-1">
            <p className="text-xl font-bold">{user?.username || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
          </div>
        </div>

        {/* Tabs: Chat History / My Products */}
        <Tabs defaultValue="my-products" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="chat-history" className="flex-1">{t('chatHistory')}</TabsTrigger>
            <TabsTrigger value="my-products" className="flex-1">{t('myProducts')}</TabsTrigger>
          </TabsList>

          {/* Chat History Tab */}
          <TabsContent value="chat-history">
            {showChat ? (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50">
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate('/chat/example-seller')}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      ES
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-sm">Example Seller</p>
                      <span className="text-xs text-gray-400">2m {t('mAgo')}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">Hi! Is this item still available?</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setShowChat(false)}
                >
                  {t('delete')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border">
                {t('chatHistory')} —
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
                    <CardDescription>Manage your product listings</CardDescription>
                  </div>
                  <Button
                    onClick={() => navigate('/create-product')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    + Create New Product
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading your products...</span>
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
                  <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-6">Start selling by creating your first product listing</p>
                  <Button
                    onClick={() => navigate('/create-product')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    Create Your First Product
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
                              <span className="text-gray-400">No image</span>
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
                            <span>Condition: {getConditionLabel(product.condition)}</span>
                            <span>Posted: {new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/edit-product/${product.listingID}`)} className="gap-2">
                              <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                            {product.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-500 border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                onClick={async () => {
                                  try {
                                    await productService.updateProduct(product.listingID, { status: 'inactive' });
                                    setProducts(products.map((p: any) =>
                                      p.listingID === product.listingID ? { ...p, status: 'inactive' } : p
                                    ));
                                    toast.success('Product unlisted');
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.error?.message || 'Failed to unlist');
                                  }
                                }}
                              >
                                {t('unlist')}
                              </Button>
                            ) : product.status === 'inactive' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                                onClick={async () => {
                                  try {
                                    await productService.updateProduct(product.listingID, { status: 'active' });
                                    setProducts(products.map((p: any) =>
                                      p.listingID === product.listingID ? { ...p, status: 'active' } : p
                                    ));
                                    toast.success('Product relisted');
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.error?.message || 'Failed to relist');
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
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open: any) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteProduct(deleteConfirm)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MyPage;
