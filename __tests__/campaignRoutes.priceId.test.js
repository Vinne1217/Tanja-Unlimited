/**
 * Test suite for campaignRoutes priceId flow
 * 
 * This test verifies the new priceId-based campaign lookup flow
 * that prioritizes Stripe priceId over productId, while maintaining
 * backwards compatibility with the legacy productId flow.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to your Source Portal/Source Database project
 * 2. Ensure handleCampaignPriceRequest is exported from routes/campaignRoutes.js
 * 3. Adjust the import statement below based on your module system (CommonJS or ES modules)
 * 4. Install dependencies: npm install --save-dev jest @types/jest
 * 5. Run: npm test
 */

// Mock Campaign model
const mockCampaign = {
  findOne: jest.fn(),
  find: jest.fn()
};

// Mock the Campaign model
// Adjust the path '../models/Campaign' based on your project structure
jest.mock('../models/Campaign', () => mockCampaign, { virtual: true });

// Mock request/response objects
const createMockRequest = (overrides = {}) => ({
  get: jest.fn((header) => {
    if (header === 'X-Tenant') return overrides.tenant || null;
    return null;
  }),
  query: overrides.query || {},
  params: overrides.params || {},
  ...overrides
});

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

describe('Campaign Price API - priceId Flow', () => {
  let handleCampaignPriceRequest;

  beforeAll(async () => {
    // IMPORTANT: Adjust this import based on your project structure
    // For CommonJS projects:
    // const campaignRoutes = require('../routes/campaignRoutes');
    // handleCampaignPriceRequest = campaignRoutes.handleCampaignPriceRequest;
    
    // For ES modules, you may need to use dynamic import:
    try {
      const campaignRoutes = await import('../routes/campaignRoutes.js');
      handleCampaignPriceRequest = campaignRoutes.handleCampaignPriceRequest;
    } catch (e) {
      // Fallback to CommonJS
      const campaignRoutes = require('../routes/campaignRoutes');
      handleCampaignPriceRequest = campaignRoutes.handleCampaignPriceRequest;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('priceId-based lookup (new flow)', () => {
    it('should return campaign when priceId matches active campaign', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';
      
      const mockCampaignData = {
        _id: 'campaign_1',
        tenant: tenantId,
        stripePriceIds: [priceId],
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        name: 'Sommarkampanj',
        discountType: 'percentage',
        discountValue: 20,
        usageCount: 5,
        maxUses: 100
      };

      mockCampaign.findOne.mockResolvedValue(mockCampaignData);

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      expect(mockCampaign.findOne).toHaveBeenCalledWith({
        tenant: tenantId,
        stripePriceIds: priceId,
        status: 'active',
        startDate: { $lte: expect.any(Date) },
        endDate: { $gte: expect.any(Date) }
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hasCampaignPrice: true,
        priceId: priceId,
        discountPercent: 20,
        campaignName: 'Sommarkampanj'
      });
    });

    it('should return hasCampaignPrice: false when no campaign found for priceId', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_999';

      mockCampaign.findOne.mockResolvedValue(null);

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hasCampaignPrice: false
      });
    });

    it('should return hasCampaignPrice: false when campaign exceeds maxUses', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';

      const mockCampaignData = {
        _id: 'campaign_1',
        tenant: tenantId,
        stripePriceIds: [priceId],
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        name: 'Sommarkampanj',
        usageCount: 100,
        maxUses: 100 // Campaign is fully used
      };

      mockCampaign.findOne.mockResolvedValue(mockCampaignData);

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      // Campaign should be filtered out due to maxUses limit
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hasCampaignPrice: false
      });
    });

    it('should calculate discountPercent correctly for buy_two_get_one', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';

      const mockCampaignData = {
        _id: 'campaign_1',
        tenant: tenantId,
        stripePriceIds: [priceId],
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        name: 'Köp 2 betala för 1',
        discountType: 'buy_two_get_one',
        usageCount: 0
      };

      mockCampaign.findOne.mockResolvedValue(mockCampaignData);

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hasCampaignPrice: true,
        priceId: priceId,
        discountPercent: 50, // buy_two_get_one = 50% discount
        campaignName: 'Köp 2 betala för 1'
      });
    });

    it('should require tenantId for priceId lookup', async () => {
      const priceId = 'price_123';

      const req = createMockRequest({
        tenant: null, // No tenant
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Tenant ID required (X-Tenant header or tenant query param)'
      });
    });

    it('should accept tenantId from query parameter', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';

      mockCampaign.findOne.mockResolvedValue(null);

      const req = createMockRequest({
        tenant: null, // No header
        query: { priceId, tenant: tenantId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      expect(mockCampaign.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: tenantId
        })
      );
    });
  });

  describe('Backwards compatibility - productId flow', () => {
    it('should prioritize priceId over productId when both are provided', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';
      const productId = 'prod_123';

      const mockCampaignData = {
        _id: 'campaign_1',
        tenant: tenantId,
        stripePriceIds: [priceId],
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        name: 'Sommarkampanj',
        discountType: 'percentage',
        discountValue: 20
      };

      mockCampaign.findOne.mockResolvedValue(mockCampaignData);

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId, productId } // Both provided
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      // Should use priceId flow, not productId flow
      expect(mockCampaign.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          stripePriceIds: priceId
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasCampaignPrice: true,
          priceId: priceId
        })
      );
    });
  });

  describe('Date filtering', () => {
    it('should filter out campaigns outside date range', async () => {
      const tenantId = 'tenantA';
      const priceId = 'price_123';

      mockCampaign.findOne.mockResolvedValue(null); // Should not find expired campaign

      const req = createMockRequest({
        tenant: tenantId,
        query: { priceId }
      });
      const res = createMockResponse();

      await handleCampaignPriceRequest(req, res);

      // Verify date filtering is applied
      expect(mockCampaign.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: { $lte: expect.any(Date) },
          endDate: { $gte: expect.any(Date) }
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hasCampaignPrice: false
      });
    });
  });
});
