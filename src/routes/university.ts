import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { UniversityEmailService } from '../services/UniversityEmailService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const universityEmailService = new UniversityEmailService();

/**
 * @route   POST /api/university/verify-domain
 * @desc    Verify if an email domain is from a whitelisted university
 * @access  Public
 */
router.post('/verify-domain',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { email } = req.body;
      const emailValidationResult = await universityEmailService.validateEmailDomain(email);

      res.json({
        success: true,
        data: emailValidationResult
      });
    } catch (error) {
      console.error('Domain verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAIN_VERIFICATION_FAILED',
          message: 'Failed to verify email domain',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/university/domains
 * @desc    Get all university domains with pagination
 * @access  Public
 */
router.get('/domains',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('activeOnly').optional().isBoolean().toBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const page = req.query.page as number || 1;
      const limit = req.query.limit as number || 50;
      const activeOnly = req.query.activeOnly !== undefined ? req.query.activeOnly as boolean : true;

      const result = await universityEmailService.getAllDomains(page, limit, activeOnly);

      res.json({
        success: true,
        data: {
          domains: result.domains,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get domains error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAINS_FETCH_FAILED',
          message: 'Failed to fetch university domains',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/university/search
 * @desc    Search university domains by name or domain
 * @access  Public
 */
router.get('/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('activeOnly').optional().isBoolean().toBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const searchTerm = req.query.q as string;
      const activeOnly = req.query.activeOnly !== undefined ? req.query.activeOnly as boolean : true;

      const domains = await universityEmailService.searchDomains(searchTerm, activeOnly);

      res.json({
        success: true,
        data: {
          domains,
          searchTerm,
          count: domains.length
        }
      });
    } catch (error) {
      console.error('Search domains error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAIN_SEARCH_FAILED',
          message: 'Failed to search university domains',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/university/countries/:country
 * @desc    Get university domains by country
 * @access  Public
 */
router.get('/countries/:country',
  [
    query('activeOnly').optional().isBoolean().toBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { country } = req.params;
      const activeOnly = req.query.activeOnly !== undefined ? req.query.activeOnly as boolean : true;

      const domains = await universityEmailService.getDomainsByCountry(country, activeOnly);

      res.json({
        success: true,
        data: {
          domains,
          country,
          count: domains.length
        }
      });
    } catch (error) {
      console.error('Get domains by country error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COUNTRY_DOMAINS_FETCH_FAILED',
          message: 'Failed to fetch domains by country',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/university/stats
 * @desc    Get university domains statistics
 * @access  Public
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await universityEmailService.getDomainStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get domain stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_FAILED',
        message: 'Failed to fetch domain statistics',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
});

// Admin-only routes
/**
 * @route   POST /api/university/domains
 * @desc    Add new university domain to whitelist
 * @access  Admin
 */
router.post('/domains',
  authenticateToken,
  requireAdmin,
  [
    body('domain').isLength({ min: 3, max: 255 }).withMessage('Domain must be 3-255 characters'),
    body('universityName').isLength({ min: 2, max: 255 }).withMessage('University name must be 2-255 characters'),
    body('country').isLength({ min: 2, max: 100 }).withMessage('Country must be 2-100 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { domain, universityName, country } = req.body;

      // Check if domain already exists
      const existingDomain = await universityEmailService.getUniversityByDomain(domain);
      if (existingDomain) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DOMAIN_ALREADY_EXISTS',
            message: 'University domain already exists',
            details: { domain, existingUniversity: existingDomain.universityName },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const newDomain = await universityEmailService.addUniversityDomain(
        domain,
        universityName,
        country
      );

      res.status(201).json({
        success: true,
        data: {
          domain: newDomain,
          message: 'University domain added successfully'
        }
      });
    } catch (error) {
      console.error('Add domain error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAIN_ADD_FAILED',
          message: 'Failed to add university domain',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   PUT /api/university/domains/:domain/status
 * @desc    Update university domain status
 * @access  Admin
 */
router.put('/domains/:domain/status',
  authenticateToken,
  requireAdmin,
  [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { domain } = req.params;
      const { isActive } = req.body;

      const updatedDomain = await universityEmailService.updateDomainStatus(domain, isActive);

      res.json({
        success: true,
        data: {
          domain: updatedDomain,
          message: `Domain ${isActive ? 'activated' : 'deactivated'} successfully`
        }
      });
    } catch (error) {
      console.error('Update domain status error:', error);
      
      if ((error as Error).message === 'University domain not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOMAIN_NOT_FOUND',
            message: 'University domain not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAIN_UPDATE_FAILED',
          message: 'Failed to update domain status',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   DELETE /api/university/domains/:domain
 * @desc    Remove university domain from whitelist
 * @access  Admin
 */
router.delete('/domains/:domain',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;

      if (!domain) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DOMAIN',
            message: 'Domain parameter is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const removed = await universityEmailService.removeDomain(domain);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOMAIN_NOT_FOUND',
            message: 'University domain not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      res.json({
        success: true,
        data: {
          message: 'University domain removed successfully',
          domain
        }
      });
    } catch (error) {
      console.error('Remove domain error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOMAIN_REMOVE_FAILED',
          message: 'Failed to remove university domain',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/university/domains/bulk-import
 * @desc    Bulk import university domains
 * @access  Admin
 */
router.post('/domains/bulk-import',
  authenticateToken,
  requireAdmin,
  [
    body('domains').isArray({ min: 1 }).withMessage('Domains array is required'),
    body('domains.*.domain').isLength({ min: 3, max: 255 }).withMessage('Each domain must be 3-255 characters'),
    body('domains.*.universityName').isLength({ min: 2, max: 255 }).withMessage('Each university name must be 2-255 characters'),
    body('domains.*.country').isLength({ min: 2, max: 100 }).withMessage('Each country must be 2-100 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { domains } = req.body;

      const result = await universityEmailService.bulkImportDomains(domains);

      res.json({
        success: true,
        data: {
          ...result,
          message: `Bulk import completed: ${result.imported} imported, ${result.failed} failed`
        }
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_IMPORT_FAILED',
          message: 'Failed to bulk import domains',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

export default router;