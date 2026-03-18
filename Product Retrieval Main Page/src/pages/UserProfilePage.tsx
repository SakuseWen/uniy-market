import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Language, translate } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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

function UserProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: any) => translate(language, key);

  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVerified] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        // Use authenticated user's ID
        if (!user?.userID) {
          throw new Error('User ID not found');
        }
        const response = await productService.getUserProducts(user.userID);
        console.log('User products response:', response);
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
      
      // Remove from local state immediately for instant UI feedback
      const updatedProducts = products.filter((p: any) => p.listingID !== productId);
      setProducts(updatedProducts);
      
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Delete product error:', error);
      
      // Handle 401 Unauthorized
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

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-blue-100 text-blue-800';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getConditionLabel = (condition: string | undefined) => {
    if (!condition) return 'Unknown';
    switch (condition) {
      case 'new':
        return 'New';
      case 'like_new':
        return 'Like New';
      case 'used':
        return 'Used';
      default:
        return condition;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        userVerified={userVerified}
        unreadMessages={0}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Products</CardTitle>
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

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading your products...</span>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-24 h-24 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
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
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={`http://localhost:3000${product.images[0].imagePath}`}
                          alt={product.title}
                          className="w-32 h-32 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
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

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/edit-product/${product.listingID}`)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm(product.listingID)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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

export default UserProfilePage;
