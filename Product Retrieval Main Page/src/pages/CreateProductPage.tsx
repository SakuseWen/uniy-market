import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
import { LocationPicker } from '../components/LocationPicker';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { categories } = useCategories();

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

  // Redirect if not edu verified
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.eduVerified) {
      toast.error(t(language, 'eduRequiredToPost'));
      navigate('/my-page');
    }
  }, [isAuthenticated, user, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    condition: 'used',
    location: '',
    categoryID: '',
    deliveryType: 'faceToFace',
    latitude: 0,
    longitude: 0,
    address: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Validate file types
    const invalidFiles = Array.from(files).filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(t(language, 'unsupportedImageFormat'));
      e.target.value = '';
      return;
    }

    if (images.length + files.length > 5) {
      toast.error(t(language, 'maxImagesError'));
      return;
    }

    // 压缩图片后再添加
    try {
      const compressed = await compressImages(Array.from(files));
      setImages(prev => [...prev, ...compressed]);

      // Create previews
      compressed.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error(t(language, 'failedProcessImages'));
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const invalidFiles = files.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(t(language, 'unsupportedImageFormat'));
      return;
    }
    if (images.length + files.length > 5) {
      toast.error(t(language, 'maxImagesError'));
      return;
    }
    try {
      const compressed = await compressImages(files);
      setImages(prev => [...prev, ...compressed]);
      compressed.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error(t(language, 'failedProcessImages'));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error(t(language, 'titleRequired'));
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error(t(language, 'validPriceRequired'));
      return;
    }

    if (!formData.stock || parseInt(formData.stock) <= 0) {
      toast.error(t(language, 'stockAtLeastOne'));
      return;
    }

    if (!formData.categoryID) {
      toast.error(t(language, 'categoryRequired'));
      return;
    }

    if (images.length === 0) {
      toast.error(t(language, 'imageRequired'));
      return;
    }

    setLoading(true);

    try {
      // Create product
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        condition: formData.condition as 'new' | 'used' | 'like_new',
        location: formData.location,
        categoryID: parseInt(formData.categoryID),
        deliveryType: formData.deliveryType as 'faceToFace' | 'campusLocker' | 'courier',
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        address: formData.address || undefined,
      } as any;

      const product = await productService.createProduct(productData);
      console.log('Product created:', product);

      // Upload images
      if (images.length > 0) {
        try {
          // Add a small delay to ensure product is saved to database
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const formDataWithImages = new FormData();
          images.forEach((image, index) => {
            console.log(`Adding image ${index}:`, image.name, image.size);
            formDataWithImages.append('images', image);
          });

          console.log('Uploading images for product:', product.id);
          const uploadResponse = await productService.uploadProductImages(product.id, formDataWithImages);
          console.log('Images uploaded successfully:', uploadResponse);
          
          // Wait a bit more to ensure images are fully saved
          await new Promise(resolve => setTimeout(resolve, 500));
          
          toast.success(t(language, 'productCreatedWithImages'));
        } catch (imageError: any) {
          console.error('Image upload error:', imageError);
          console.error('Error response:', imageError.response?.data);
          // Don't fail the entire operation if image upload fails
          // The product was created successfully, just without images
          toast.warning(t(language, 'productCreatedImageFailed'));
        }
      } else {
        toast.success(t(language, 'productCreatedNoImages'));
      }

      // Navigate after everything is done
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/my-page');
    } catch (error: any) {
      console.error('Create product error:', error);
      
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error(t(language, 'sessionExpired'));
        navigate('/login');
        return;
      }

      // Handle suspended account
      if (error?.suspendedMessage) {
        toast.error(error.suspendedMessage);
        return;
      }
      
      toast.error(t(language, 'failedCreateProduct'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t(language, 'backToProducts')}
        </button>

        {/* Form Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t(language, 'createNewProduct')}</CardTitle>
            <CardDescription>{t(language, 'fillDetails')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t(language, 'productTitle')} *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={t(language, 'enterProductTitle')}
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">{formData.title.length}/200</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t(language, 'description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t(language, 'describeProduct')}
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={2000}
                  rows={5}
                />
                <p className="text-xs text-gray-500">{formData.description.length}/2000</p>
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t(language, 'price')} *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">{t(language, 'stock')} *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    placeholder="1"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Condition and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">{t(language, 'condition')} *</Label>
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
                  <Label htmlFor="category">{t(language, 'category')} *</Label>
                  <Select value={formData.categoryID} onValueChange={(value) => handleSelectChange('categoryID', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t(language, 'selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {displayCategories && displayCategories.length > 0 ? (
                        displayCategories.map((cat: any) => (
                          <SelectItem key={cat.categoryID} value={cat.categoryID.toString()}>
                            {language === 'zh' ? (cat.nameZh || cat.name) : language === 'th' ? (cat.nameTh || cat.name) : (cat.nameEn || cat.name)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">{t(language, 'loadingCategories')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label>{t(language, 'deliveryType')} *</Label>
                <Select value={formData.deliveryType || 'faceToFace'} onValueChange={(value) => handleSelectChange('deliveryType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t(language, 'deliveryType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faceToFace">{t(language, 'faceToFace')}</SelectItem>
                    <SelectItem value="campusLocker">{t(language, 'campusLocker')}</SelectItem>
                    <SelectItem value="courier">{t(language, 'courier')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t(language, 'location')}</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder={t(language, 'locationPlaceholder')}
                  value={formData.location}
                  onChange={handleInputChange}
                  maxLength={200}
                />
              </div>

              {/* Map Location */}
              <div className="space-y-2">
                <Label>{t(language, 'mapLocation') || 'Map Location'}</Label>
                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  address={formData.address}
                  onChange={(lat, lng, addr) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address: addr }))}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>{t(language, 'productImages')} * ({t(language, 'maxImages')})</Label>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group flex-shrink-0" style={{ width: 200, height: 200 }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {images.length < 5 && (
                  <label
                    className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{t(language, 'dragDropImages')}</p>
                      <p className="text-xs text-gray-500">{t(language, 'imageFormat')}</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                <p className="text-xs text-gray-500">{images.length}/5 {t(language, 'imagesCount')}</p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  {t(language, 'cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t(language, 'creating')}
                    </>
                  ) : (
                    t(language, 'createProduct')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
