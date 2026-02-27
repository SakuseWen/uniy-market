import express from 'express';
import { ProductModel } from '../models/ProductModel';
import { UserModel } from '../models/UserModel';
import { authenticateToken } from '../middleware/auth';
import { body, query, validationResult } from 'express-validator';
import { uploadConfig } from '../config/upload';
import { processUploadedImages, deleteImageFile } from '../middleware/imageProcessing';
import { notificationService } from '../services/NotificationService';
import { validateLocationPrivacy } from '../middleware/locationValidation';
import { moderateProductContent, logFlaggedContent } from '../middleware/contentModeration';
import path from 'path';

const router = express.Router();
let productModel: ProductModel | null = null;
let userModel: UserModel | null = null;

function getProductModel(): ProductModel {
  if (!productModel) {
    productModel = new ProductModel();
  }
  return productModel;
}

function getUserModel(): UserModel {
  if (!userModel) {
    userModel = new UserModel();
  }
  return userModel;
}

/**
 * @route   POST /api/products
 * @desc    Create a new product listing
 * @access  Private (verified students only)
 */
router.post('/',
  authenticateToken,
  [
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be between 1-200 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 1 }).withMessage('Stock must be at least 1'),
    body('condition').isIn(['new', 'used', 'like_new']).withMessage('Condition must be new, used, or like_new'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('categoryID').isInt({ min: 1 }).withMessage('Valid category ID is required'),
  ],
  validateLocationPrivacy,
  moderateProductContent,
  logFlaggedContent,
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const user = req.user as any;

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_NOT_VERIFIED',
            message: 'Only verified university students can create product listings',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Verify category exists
      const category = await getProductModel().getCategoryById(req.body.categoryID);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Category does not exist',
            field: 'categoryID',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Create product listing
      const productData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
        condition: req.body.condition,
        location: req.body.location,
        categoryID: req.body.categoryID,
        sellerID: user.userID,
        status: 'active' as const
      };

      const product = await getProductModel().createProduct(productData);

      return res.status(201).json({
        success: true,
        data: {
          product
        },
        message: 'Product listing created successfully'
      });

    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCT_CREATION_FAILED',
          message: 'Failed to create product listing',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product details with seller information
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get product
    const product = await getProductModel().getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Get seller information
    const seller = await getUserModel().getUserById(product.sellerID);
    if (!seller) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SELLER_NOT_FOUND',
          message: 'Seller information not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Get seller reputation
    const sellerReputation = await getUserModel().getUserReputation(seller.userID);

    // Get product images
    const images = await getProductModel().getProductImages(product.listingID);

    // Get category
    const category = await getProductModel().getCategoryById(product.categoryID);

    // Increment view count (fire and forget)
    getProductModel().incrementViews(product.listingID).catch(err => 
      console.error('Failed to increment views:', err)
    );

    // Prepare seller info (exclude sensitive data)
    const sellerInfo = {
      userID: seller.userID,
      name: seller.name,
      profileImage: seller.profileImage,
      isVerified: seller.isVerified,
      reputation: sellerReputation
    };

    return res.json({
      success: true,
      data: {
        product,
        seller: sellerInfo,
        images,
        category
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_FETCH_FAILED',
        message: 'Failed to fetch product details',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product listing
 * @access  Private (product owner only)
 */
router.put('/:id',
  authenticateToken,
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('condition').optional().isIn(['new', 'used', 'like_new']).withMessage('Condition must be new, used, or like_new'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('categoryID').optional().isInt({ min: 1 }).withMessage('Valid category ID is required'),
    body('status').optional().isIn(['active', 'sold', 'inactive']).withMessage('Status must be active, sold, or inactive'),
  ],
  validateLocationPrivacy,
  moderateProductContent,
  logFlaggedContent,
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const { id } = req.params;
      const user = req.user as any;

      // Get existing product
      const existingProduct = await getProductModel().getProductById(id!);
      
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check ownership (only seller or admin can update)
      if (existingProduct.sellerID !== user.userID && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have permission to update this product',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // If categoryID is being updated, verify it exists
      if (req.body.categoryID) {
        const category = await getProductModel().getCategoryById(req.body.categoryID);
        if (!category) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CATEGORY',
              message: 'Category does not exist',
              field: 'categoryID',
              timestamp: new Date().toISOString(),
              requestId: req.get('x-request-id') || 'unknown'
            }
          });
        }
      }

      // Update product
      const updates = req.body;
      const updatedProduct = await getProductModel().updateProduct(id!, updates);

      return res.json({
        success: true,
        data: {
          product: updatedProduct
        },
        message: 'Product updated successfully'
      });

    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCT_UPDATE_FAILED',
          message: 'Failed to update product',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product listing (soft delete)
 * @access  Private (product owner or admin only)
 */
router.delete('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Get existing product
    const existingProduct = await getProductModel().getProductById(id!);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Check ownership (only seller or admin can delete)
    if (existingProduct.sellerID !== user.userID && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to delete this product',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Soft delete (set status to inactive)
    const deleted = await getProductModel().deleteProduct(id!);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCT_DELETE_FAILED',
          message: 'Failed to delete product',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_DELETE_FAILED',
        message: 'Failed to delete product',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Search and filter products
 * @access  Public
 */
router.get('/',
  [
    query('q').optional().trim(),
    query('category').optional().isInt({ min: 1 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('location').optional().trim(),
    query('condition').optional().isIn(['new', 'used', 'like_new']),
    query('sortBy').optional().isIn(['price_asc', 'price_desc', 'date_asc', 'date_desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const query = req.query['q'] as string | undefined;
      const filters: any = {};
      
      if (req.query['category']) {
        filters.category = parseInt(req.query['category'] as string);
      }
      if (req.query['minPrice']) {
        filters.minPrice = parseFloat(req.query['minPrice'] as string);
      }
      if (req.query['maxPrice']) {
        filters.maxPrice = parseFloat(req.query['maxPrice'] as string);
      }
      if (req.query['location']) {
        filters.location = req.query['location'] as string;
      }
      if (req.query['condition']) {
        filters.condition = req.query['condition'] as 'new' | 'used' | 'like_new';
      }
      if (req.query['sortBy']) {
        filters.sortBy = req.query['sortBy'] as 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
      }

      const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 20;

      const result = await getProductModel().searchProducts(query, filters, page, limit);

      // Enrich products with images, seller, and category information
      const enrichedProducts = await Promise.all(
        result.data.map(async (product) => {
          const [images, seller, category] = await Promise.all([
            getProductModel().getProductImages(product.listingID),
            getUserModel().getUserById(product.sellerID),
            getProductModel().getCategoryById(product.categoryID)
          ]);

          return {
            ...product,
            images,
            seller: seller ? {
              userID: seller.userID,
              name: seller.name,
              profileImage: seller.profileImage,
              isVerified: seller.isVerified,
              isAdmin: seller.isAdmin
            } : null,
            category
          };
        })
      );

      return res.json({
        success: true,
        products: enrichedProducts,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev
      });

    } catch (error) {
      console.error('Search products error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCT_SEARCH_FAILED',
          message: 'Failed to search products',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/products/seller/:sellerId
 * @desc    Get products by seller
 * @access  Public
 */
router.get('/seller/:sellerId',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { sellerId } = req.params;
      const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 20;

      // Verify seller exists
      const seller = await getUserModel().getUserById(sellerId!);
      if (!seller) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SELLER_NOT_FOUND',
            message: 'Seller not found',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const result = await getProductModel().getProductsBySeller(sellerId!, page, limit);

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get seller products error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SELLER_PRODUCTS_FETCH_FAILED',
          message: 'Failed to fetch seller products',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/products/:id/mark-sold
 * @desc    Mark product as sold
 * @access  Private (product owner only)
 */
router.post('/:id/mark-sold', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Get existing product
    const existingProduct = await getProductModel().getProductById(id!);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Check ownership
    if (existingProduct.sellerID !== user.userID && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to mark this product as sold',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Mark as sold
    const updatedProduct = await getProductModel().markAsSold(id!);

    return res.json({
      success: true,
      data: {
        product: updatedProduct
      },
      message: 'Product marked as sold successfully'
    });

  } catch (error) {
    console.error('Mark as sold error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MARK_SOLD_FAILED',
        message: 'Failed to mark product as sold',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   GET /api/categories
 * @desc    Get all active categories
 * @access  Public
 */
router.get('/categories/all', async (req: express.Request, res: express.Response) => {
  try {
    const categories = await getProductModel().getCategories();

    return res.json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIES_FETCH_FAILED',
        message: 'Failed to fetch categories',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload product images
 * @access  Private (product owner only)
 */
router.post('/:id/images',
  authenticateToken,
  uploadConfig.array('images', 5), // Accept up to 5 images
  processUploadedImages,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      // Check if files were uploaded
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES_UPLOADED',
            message: 'No image files were uploaded',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Get existing product
      const existingProduct = await getProductModel().getProductById(id!);
      
      if (!existingProduct) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteImageFile(file.path);
        }
        
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check ownership (only seller can upload images)
      if (existingProduct.sellerID !== user.userID && !user.isAdmin) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteImageFile(file.path);
        }
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have permission to upload images for this product',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check if product already has images
      const existingImages = await getProductModel().getProductImages(id!);
      const totalImages = existingImages.length + req.files.length;

      if (totalImages > 5) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteImageFile(file.path);
        }
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_IMAGES',
            message: `Product can have maximum 5 images. Current: ${existingImages.length}, Attempting to add: ${req.files.length}`,
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Add images to database
      const uploadedImages = [];
      const isPrimaryImage = existingImages.length === 0; // First image is primary

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        if (!file) continue; // Skip if file is undefined
        
        // Store relative path from public directory
        const relativePath = `/uploads/products/${path.basename(file.path)}`;
        
        const imageData = {
          listingID: id!,
          imagePath: relativePath,
          isPrimary: isPrimaryImage && i === 0 // Only first image of first upload is primary
        };

        const image = await getProductModel().addProductImage(imageData);
        uploadedImages.push(image);
      }

      return res.status(201).json({
        success: true,
        data: {
          images: uploadedImages,
          totalImages: existingImages.length + uploadedImages.length
        },
        message: `Successfully uploaded ${uploadedImages.length} image(s)`
      });

    } catch (error) {
      console.error('Upload product images error:', error);
      
      // Clean up uploaded files on error
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await deleteImageFile(file.path);
        }
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'IMAGE_UPLOAD_FAILED',
          message: 'Failed to upload product images',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   DELETE /api/products/images/:imageId
 * @desc    Delete product image
 * @access  Private (product owner only)
 */
router.delete('/images/:imageId', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { imageId } = req.params;
    const user = req.user as any;

    // Get image
    const image = await getProductModel().getProductImageById(imageId!);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Get product to check ownership
    const product = await getProductModel().getProductById(image.listingID);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Check ownership (only seller or admin can delete)
    if (product.sellerID !== user.userID && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to delete this image',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Delete from database
    const deleted = await getProductModel().deleteProductImage(imageId!);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'IMAGE_DELETE_FAILED',
          message: 'Failed to delete image from database',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    // Delete file from disk (fire and forget - don't fail if file doesn't exist)
    deleteImageFile(image.imagePath).catch(err => 
      console.error('Failed to delete image file:', err)
    );

    return res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete product image error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMAGE_DELETE_FAILED',
        message: 'Failed to delete product image',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

export default router;

/**
 * @route   GET /api/products/notifications/my
 * @desc    Get current user's product status notifications
 * @access  Private
 */
router.get('/notifications/my', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user as any;
    
    const notifications = await notificationService.getUserNotifications(user.userID);
    const count = await notificationService.getNotificationCount(user.userID);

    return res.json({
      success: true,
      data: {
        notifications,
        count
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: 'Failed to fetch notifications',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   GET /api/products/notifications/unread
 * @desc    Get unread notifications for current user
 * @access  Private
 */
router.get('/notifications/unread', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user as any;
    
    const notifications = await notificationService.getUnreadNotifications(user.userID);

    return res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      }
    });

  } catch (error) {
    console.error('Get unread notifications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: 'Failed to fetch unread notifications',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   PUT /api/products/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/notifications/:notificationId/read', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { notificationId } = req.params;
    const user = req.user as any;
    
    const success = await notificationService.markAsRead(user.userID, notificationId!);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_FAILED',
        message: 'Failed to mark notification as read',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   PUT /api/products/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/notifications/read-all', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user as any;
    
    const count = await notificationService.markAllAsRead(user.userID);

    return res.json({
      success: true,
      data: {
        markedCount: count
      },
      message: `Marked ${count} notification(s) as read`
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_FAILED',
        message: 'Failed to mark all notifications as read',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});
