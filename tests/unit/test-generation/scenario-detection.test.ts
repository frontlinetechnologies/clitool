import { detectSpecificScenarios } from '../../../src/test-generation/test-generator';
import { InputField } from '../../../src/models/input-field';
import { Form } from '../../../src/models/form';
import { SpecificScenario } from '../../../src/test-generation/models';

describe('Scenario Detection', () => {
  describe('coupon code detection', () => {
    it('should detect coupon code field by name', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      expect(scenarios.length).toBeGreaterThan(0);
      const couponScenario = scenarios.find((s: SpecificScenario) => s.type === 'coupon-code');
      expect(couponScenario).toBeDefined();
      expect(couponScenario!.pageUrl).toBe('https://example.com/checkout');
    });

    it('should detect coupon code field by placeholder', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'code', placeholder: 'Enter coupon code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const couponScenario = scenarios.find((s: SpecificScenario) => s.type === 'coupon-code');
      expect(couponScenario).toBeDefined();
    });

    it('should detect coupon field with partial name match', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'discountCoupon', pageUrl: 'https://example.com/cart' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const couponScenario = scenarios.find((s: SpecificScenario) =>
        s.type === 'coupon-code' || s.type === 'discount'
      );
      expect(couponScenario).toBeDefined();
    });
  });

  describe('promo code detection', () => {
    it('should detect promo code field by name', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'promo_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const promoScenario = scenarios.find((s: SpecificScenario) => s.type === 'promo-code');
      expect(promoScenario).toBeDefined();
    });

    it('should detect promo code field by placeholder', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'code', placeholder: 'Enter promo code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const promoScenario = scenarios.find((s: SpecificScenario) => s.type === 'promo-code');
      expect(promoScenario).toBeDefined();
    });
  });

  describe('discount code detection', () => {
    it('should detect discount field by name', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'discount_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const discountScenario = scenarios.find((s: SpecificScenario) => s.type === 'discount');
      expect(discountScenario).toBeDefined();
    });
  });

  describe('scenario detection from forms', () => {
    it('should detect scenarios from form input fields', () => {
      const forms: Form[] = [
        {
          id: 'checkout-form',
          action: '/checkout',
          method: 'POST',
          pageUrl: 'https://example.com/checkout',
          inputFields: [
            { type: 'text', name: 'coupon', pageUrl: 'https://example.com/checkout' },
          ],
        },
      ];

      const scenarios = detectSpecificScenarios([], forms);

      const couponScenario = scenarios.find((s: SpecificScenario) => s.type === 'coupon-code');
      expect(couponScenario).toBeDefined();
    });
  });

  describe('test data generation for scenarios', () => {
    it('should include generated test data for coupon scenario', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const couponScenario = scenarios.find((s: SpecificScenario) => s.type === 'coupon-code');
      expect(couponScenario).toBeDefined();
      expect(couponScenario!.testData).toBeDefined();
      expect(couponScenario!.testData).toMatch(/^[A-Z]+$/); // Uppercase coupon code
    });
  });

  describe('detection pattern tracking', () => {
    it('should track the detection pattern used', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'promo_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      const promoScenario = scenarios.find((s: SpecificScenario) => s.type === 'promo-code');
      expect(promoScenario).toBeDefined();
      expect(promoScenario!.detectionPattern).toContain('promo');
    });
  });

  describe('multiple scenarios detection', () => {
    it('should detect multiple scenarios on same page', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/checkout' },
        { type: 'text', name: 'gift_card', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      expect(scenarios.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect scenarios across multiple pages', () => {
      const inputFields: InputField[] = [
        { type: 'text', name: 'coupon_code', pageUrl: 'https://example.com/cart' },
        { type: 'text', name: 'promo_code', pageUrl: 'https://example.com/checkout' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      expect(scenarios.length).toBeGreaterThanOrEqual(2);
      
      const pages = new Set(scenarios.map((s: SpecificScenario) => s.pageUrl));
      expect(pages.size).toBe(2);
    });
  });

  describe('no scenarios', () => {
    it('should return empty array when no scenarios detected', () => {
      const inputFields: InputField[] = [
        { type: 'email', name: 'email', pageUrl: 'https://example.com/contact' },
        { type: 'text', name: 'name', pageUrl: 'https://example.com/contact' },
      ];

      const scenarios = detectSpecificScenarios(inputFields, []);

      expect(scenarios.length).toBe(0);
    });
  });
});

