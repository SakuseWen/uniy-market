import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Language, translate } from '../lib/i18n';
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

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<Language>('en');
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
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    condition: 'used',
    location: '',
    categoryID: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userVerified] = useState(true);

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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = Array.from(files);
    setImages(prev => [...prev, ...newImages]);

    // Create previews
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    if (!formData.stock || parseInt(formData.stock) <= 0) {
      toast.error('Stock must be at least 1');
      return;
    }

    if (!formData.categoryID) {
      toast.error('Category is required');
      return;
    }

    if (images.length === 0) {
      toast.error('At least one image is required');
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
      };

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
          
          toast.success('Product created with images!');
        } catch (imageError: any) {
          console.error('Image upload error:', imageError);
          console.error('Error response:', imageError.response?.data);
          // Don't fail the entire operation if image upload fails
          // The product was created successfully, just without images
          toast.warning('Product created but image upload failed. You can add images later.');
        }
      } else {
        toast.success('Product created successfully!');
      }

      // Navigate after everything is done
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/my-page');
    } catch (error: any) {
      console.error('Create product error:', error);
      
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please login again.');
        navigate('/login');
        return;
      }
      
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
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

        {/* Form Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
            <CardDescription>Fill in the details to list your product</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter product title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">{formData.title.length}/200</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your product in detail"
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
                  <Label htmlFor="price">Price *</Label>
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
                  <Label htmlFor="stock">Stock *</Label>
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
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.categoryID} onValueChange={(value) => handleSelectChange('categoryID', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayCategories && displayCategories.length > 0 ? (
                        displayCategories.map((cat: any) => (
                          <SelectItem key={cat.categoryID} value={cat.categoryID.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">Loading categories...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Campus A, Building 1"
                  value={formData.location}
                  onChange={handleInputChange}
                  maxLength={200}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Product Images * (Max 5)</Label>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {images.length < 5 && (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                <p className="text-xs text-gray-500">{images.length}/5 images</p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
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
