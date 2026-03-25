import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../components/Header';
import { Language, translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';

const t = (lang: Language, key: string) => translate(lang, key as any);
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { productService } from '../services';
import { useCategories } from '../hooks';
import { useAuth } from '../services/authContext';
import { compressImages } from '../lib/imageUtils';

interface ProductImage {
  imageID: string;
  imagePath: string;
  isPrimary: boolean;
}

interface Product {
  listingID: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  condition: string;
  location: string;
  categoryID: number;
  status: string;
  images?: ProductImage[];
}

export default function EditProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Default categories in case API fails
  const defaultCategories = [
    { categoryID: 1, name: 'Electronics' },
    { categoryID: 2, name: 'Books' },
    { categoryID: 3, name: 'Clothing' },
    { categoryID: 4, name: 'Furniture' },
    { categoryID: 5, name: 'Others' },
  ];
  
  const displayCategories = categories && categories.length > 0 ? categories : defaultCategories;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Form state
  const [formData, setFormData] = useState<Product | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) return;
        setLoading(true);
        const { product: backendProduct, images } = await (productService as any).getProductByIdForEdit(productId);
        
        // Convert to edit format
        const product: Product = {
          listingID: backendProduct.listingID,
          title: backendProduct.title,
          description: backendProduct.description || '',
          price: backendProduct.price,
          stock: backendProduct.stock,
          condition: backendProduct.condition,
          location: backendProduct.location || '',
          categoryID: backendProduct.categoryID,
          status: backendProduct.status,
          images: images || [],
        };
        console.log('Loaded product with images:', product.images);
        setFormData(product);
      } catch (error: any) {
        console.error('Fetch product error:', error);
        toast.error(t(language, 'failedLoadProduct'));
        navigate('/my-page');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, navigate]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? {
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value,
    } : null);
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    if (!formData) return;
    setFormData(prev => prev ? {
      ...prev,
      [name]: name === 'categoryID' ? parseInt(value) : value,
    } : null);
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const invalidFiles = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(t(language, 'unsupportedImageFormat'));
      e.target.value = '';
      return;
    }

    if (newImages.length + files.length > 5) {
      toast.error(t(language, 'maxImagesError'));
      return;
    }

    // 压缩图片后再添加
    try {
      const compressed = await compressImages(files);
      setNewImages(prev => [...prev, ...compressed]);

      // Create previews
      compressed.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error(t(language, 'failedProcessImages'));
    }
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const invalidFiles = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(t(language, 'unsupportedImageFormat'));
      return;
    }
    if (newImages.length + files.length > 5) {
      toast.error(t(language, 'maxImagesError'));
      return;
    }
    try {
      const compressed = await compressImages(files);
      setNewImages(prev => [...prev, ...compressed]);
      compressed.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error(t(language, 'failedProcessImages'));
    }
  };

  // Mark image for deletion
  const markImageForDeletion = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !productId) return;

    setSaving(true);
    try {
      // Update product
      await productService.updateProduct(productId, {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        condition: formData.condition as 'new' | 'used' | 'like_new',
        location: formData.location,
        categoryID: formData.categoryID,
      });

      // Delete marked images
      for (const imageId of imagesToDelete) {
        await productService.deleteProductImage(imageId);
      }

      // Upload new images
      if (newImages.length > 0) {
        try {
          const formDataObj = new FormData();
          newImages.forEach(file => {
            formDataObj.append('images', file);
          });
          await productService.uploadProductImages(productId, formDataObj);
        } catch (imgError: any) {
          console.error('Image upload error:', imgError);
          console.error('Image upload response:', imgError.response?.data);
          // Product info was updated successfully, just images failed
          toast.warning(t(language, 'productUpdatedImageFailed') || 'Product updated but image upload failed');
          setTimeout(() => navigate('/my-page'), 1000);
          return;
        }
      }

      toast.success(t(language, 'productUpdated'));
      setTimeout(() => navigate('/my-page'), 1000);
    } catch (error: any) {
      console.error('Update product error:', error);
      
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error(t(language, 'sessionExpired'));
        navigate('/login');
        return;
      }
      
      toast.error(t(language, 'failedUpdateProduct'));
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          unreadMessages={0}
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">{t(language, 'loadingProduct')}</span>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          unreadMessages={0}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t(language, 'productNotFound')}</h1>
            <Button onClick={() => navigate('/my-page')}>{t(language, 'backToMyProducts')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        unreadMessages={0}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-page')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t(language, 'backToMyProducts')}
        </button>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t(language, 'editProduct')}</CardTitle>
            <CardDescription>{t(language, 'updateProductInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t(language, 'productTitle')}</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t(language, 'enterProductTitle')}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t(language, 'description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t(language, 'describeYourProduct')}
                  rows={4}
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t(language, 'priceDollar')}</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">{t(language, 'stock')}</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="1"
                    required
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">{t(language, 'condition')}</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t(language, 'new')}</SelectItem>
                      <SelectItem value="like_new">{t(language, 'likeNew')}</SelectItem>
                      <SelectItem value="used">{t(language, 'used')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryID">{t(language, 'category')}</Label>
                  <Select 
                    value={formData.categoryID?.toString() || '1'} 
                    onValueChange={(value) => handleSelectChange('categoryID', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {displayCategories && displayCategories.length > 0 ? (
                        displayCategories.map((cat: any) => (
                          <SelectItem key={cat.categoryID} value={cat.categoryID.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">{t(language, 'loadingCategories')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t(language, 'location')}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t(language, 'enterLocation')}
                />
              </div>

              {/* Existing Images */}
              {formData.images && formData.images.length > 0 && (
                <div className="space-y-2">
                  <Label>{t(language, 'currentImages')}</Label>
                  <div className="flex flex-wrap gap-3">
                    {formData.images
                      .filter(img => !imagesToDelete.includes(img.imageID))
                      .map(image => {
                        const imageUrl = image.imagePath.startsWith('http') 
                          ? image.imagePath 
                          : `http://localhost:3000${image.imagePath}`;
                        
                        return (
                          <div key={image.imageID} className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
                            <img
                              src={imageUrl}
                              alt="Product"
                              style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrl);
                                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => markImageForDeletion(image.imageID)}
                              style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* New Images */}
              <div className="space-y-2">
                <Label>{t(language, 'addNewImages')} ({t(language, 'maxImages')})</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">{t(language, 'dragDropImages')}</p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-input"
                  />
                  <label htmlFor="image-input" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>{t(language, 'selectImages')}</span>
                    </Button>
                  </label>
                </div>

                {/* Image Previews */}
                {newImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
                        <img
                          src={preview}
                          alt={`Preview ${index}`}
                          style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t(language, 'saving')}
                    </>
                  ) : (
                    t(language, 'saveChanges')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/my-page')}
                >
                  {t(language, 'cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
