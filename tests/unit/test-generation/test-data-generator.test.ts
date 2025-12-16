import {
  generateTestDataForField,
  generateEmail,
  generatePassword,
  generatePhone,
  generateCreditCard,
  generateCouponCode,
  generateDate,
  generateTestData,
} from '../../../src/test-generation/test-data-generator';
import { InputField } from '../../../src/models/input-field';

describe('Test Data Generator', () => {
  describe('generateEmail', () => {
    it('should generate a valid test email', () => {
      const email = generateEmail();

      expect(email).toBe('test.user@example.com');
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('generatePassword', () => {
    it('should generate a secure test password', () => {
      const password = generatePassword();

      expect(password).toBe('TestPassword123!');
      // Should contain uppercase, lowercase, number, and special char
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*]/);
    });
  });

  describe('generatePhone', () => {
    it('should generate a valid test phone number', () => {
      const phone = generatePhone();

      expect(phone).toBe('+1-555-123-4567');
      expect(phone).toMatch(/^\+?[\d\-]+$/);
    });
  });

  describe('generateCreditCard', () => {
    it('should generate a Visa test card number', () => {
      const card = generateCreditCard();

      expect(card).toBe('4111111111111111');
      // Visa test card starts with 4 and is 16 digits
      expect(card).toMatch(/^4\d{15}$/);
    });
  });

  describe('generateCouponCode', () => {
    it('should generate an uppercase coupon code', () => {
      const coupon = generateCouponCode();

      expect(coupon).toBe('TESTCOUPON');
      expect(coupon).toMatch(/^[A-Z]+$/);
    });
  });

  describe('generateDate', () => {
    it('should generate a future date in YYYY-MM-DD format', () => {
      const date = generateDate();

      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const generatedDate = new Date(date);
      const today = new Date();
      expect(generatedDate.getTime()).toBeGreaterThan(today.getTime());
    });

    it('should generate a date approximately one month from now', () => {
      const date = generateDate();
      const generatedDate = new Date(date);
      const today = new Date();
      
      const diffDays = Math.floor((generatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Should be between 27 and 32 days (approximately one month)
      expect(diffDays).toBeGreaterThanOrEqual(27);
      expect(diffDays).toBeLessThanOrEqual(32);
    });
  });

  describe('generateTestDataForField', () => {
    it('should detect email fields by type', () => {
      const field: InputField = {
        type: 'email',
        name: 'user_input',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('test.user@example.com');
    });

    it('should detect email fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'user_email',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('test.user@example.com');
    });

    it('should detect email fields by placeholder', () => {
      const field: InputField = {
        type: 'text',
        name: 'input1',
        placeholder: 'Enter your email',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('test.user@example.com');
    });

    it('should detect password fields by type', () => {
      const field: InputField = {
        type: 'password',
        name: 'secret',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TestPassword123!');
    });

    it('should detect password fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'user_password',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TestPassword123!');
    });

    it('should detect phone fields by type', () => {
      const field: InputField = {
        type: 'tel',
        name: 'contact',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('+1-555-123-4567');
    });

    it('should detect phone fields by name containing phone', () => {
      const field: InputField = {
        type: 'text',
        name: 'phone_number',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('+1-555-123-4567');
    });

    it('should detect phone fields by name containing mobile', () => {
      const field: InputField = {
        type: 'text',
        name: 'mobile',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('+1-555-123-4567');
    });

    it('should detect credit card fields by name containing card', () => {
      const field: InputField = {
        type: 'text',
        name: 'card_number',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('4111111111111111');
    });

    it('should detect credit card fields by name containing credit', () => {
      const field: InputField = {
        type: 'text',
        name: 'credit_card',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('4111111111111111');
    });

    it('should detect CVV fields', () => {
      const field: InputField = {
        type: 'text',
        name: 'cvv',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('4111111111111111');
    });

    it('should detect CVC fields', () => {
      const field: InputField = {
        type: 'text',
        name: 'cvc',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('4111111111111111');
    });

    it('should detect coupon fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'coupon_code',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TESTCOUPON');
    });

    it('should detect promo fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'promo_code',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TESTCOUPON');
    });

    it('should detect discount fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'discount_code',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TESTCOUPON');
    });

    it('should detect coupon fields by placeholder', () => {
      const field: InputField = {
        type: 'text',
        name: 'code',
        placeholder: 'Enter coupon code',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TESTCOUPON');
    });

    it('should detect promo fields by placeholder', () => {
      const field: InputField = {
        type: 'text',
        name: 'code',
        placeholder: 'Enter promo code',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('TESTCOUPON');
    });

    it('should detect date fields by type', () => {
      const field: InputField = {
        type: 'date',
        name: 'appointment',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should detect date fields by name', () => {
      const field: InputField = {
        type: 'text',
        name: 'birth_date',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use placeholder for text fields when available', () => {
      const field: InputField = {
        type: 'text',
        name: 'input1',
        placeholder: 'Company Name',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      // The implementation lowercases placeholder for pattern matching, then uses it in template
      expect(value).toBe('Test company name');
    });

    it('should use field name for text fields without placeholder', () => {
      const field: InputField = {
        type: 'text',
        name: 'first_name',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('Test first_name');
    });

    it('should return generic value for unknown fields', () => {
      const field: InputField = {
        type: 'text',
        pageUrl: 'https://example.com',
      };

      const value = generateTestDataForField(field);

      expect(value).toBe('Test Value');
    });
  });

  describe('generateTestData', () => {
    it('should generate test data object for multiple fields', () => {
      const fields: InputField[] = [
        { type: 'email', name: 'email', pageUrl: 'https://example.com' },
        { type: 'password', name: 'password', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.email).toBe('test.user@example.com');
      expect(testData.password).toBe('TestPassword123!');
    });

    it('should populate phone field', () => {
      const fields: InputField[] = [
        { type: 'tel', name: 'phone', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.phone).toBe('+1-555-123-4567');
    });

    it('should populate credit card field', () => {
      const fields: InputField[] = [
        { type: 'text', name: 'card_number', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.creditCard).toBe('4111111111111111');
    });

    it('should populate coupon code field', () => {
      const fields: InputField[] = [
        { type: 'text', name: 'coupon', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.couponCode).toBe('TESTCOUPON');
    });

    it('should populate date field', () => {
      const fields: InputField[] = [
        { type: 'date', name: 'date', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should store other fields in custom object', () => {
      const fields: InputField[] = [
        { type: 'text', name: 'company', placeholder: 'Company Name', pageUrl: 'https://example.com' },
        { type: 'text', name: 'address', placeholder: 'Street Address', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.custom).toBeDefined();
      expect(testData.custom!['company']).toBe('Test company name');
      expect(testData.custom!['address']).toBe('Test street address');
    });

    it('should handle fields without name', () => {
      const fields: InputField[] = [
        { type: 'text', placeholder: 'Something', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.custom).toBeDefined();
      expect(testData.custom!['field']).toBe('Test something');
    });

    it('should return empty object for empty fields array', () => {
      const testData = generateTestData([]);

      expect(testData).toEqual({});
    });

    it('should handle complete form with multiple field types', () => {
      const fields: InputField[] = [
        { type: 'email', name: 'email', pageUrl: 'https://example.com' },
        { type: 'password', name: 'password', pageUrl: 'https://example.com' },
        { type: 'tel', name: 'phone', pageUrl: 'https://example.com' },
        { type: 'text', name: 'card_number', pageUrl: 'https://example.com' },
        { type: 'text', name: 'coupon', pageUrl: 'https://example.com' },
        { type: 'date', name: 'date', pageUrl: 'https://example.com' },
        { type: 'text', name: 'first_name', pageUrl: 'https://example.com' },
      ];

      const testData = generateTestData(fields);

      expect(testData.email).toBe('test.user@example.com');
      expect(testData.password).toBe('TestPassword123!');
      expect(testData.phone).toBe('+1-555-123-4567');
      expect(testData.creditCard).toBe('4111111111111111');
      expect(testData.couponCode).toBe('TESTCOUPON');
      expect(testData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(testData.custom!['first_name']).toBe('Test first_name');
    });
  });
});

