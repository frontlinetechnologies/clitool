/**
 * Test data generator for generating realistic test data for different input types.
 * Generates test data for email, password, text, phone, credit card, coupon codes, dates per research.md patterns.
 */

import { InputField } from '../models/input-field';
import { TestData } from './models';

/**
 * Generates test data for a given input field based on its type and attributes.
 *
 * @param field - Input field to generate test data for
 * @returns Generated test data value as string
 */
export function generateTestDataForField(field: InputField): string {
  const fieldType = field.type.toLowerCase();
  const fieldName = field.name?.toLowerCase() || '';
  const placeholder = field.placeholder?.toLowerCase() || '';

  // Email fields
  if (fieldType === 'email' || fieldName.includes('email') || placeholder.includes('email')) {
    return generateEmail();
  }

  // Password fields
  if (fieldType === 'password' || fieldName.includes('password')) {
    return generatePassword();
  }

  // Phone fields
  if (fieldType === 'tel' || fieldName.includes('phone') || fieldName.includes('mobile')) {
    return generatePhone();
  }

  // Credit card fields
  if (
    fieldName.includes('card') ||
    fieldName.includes('credit') ||
    fieldName.includes('cvv') ||
    fieldName.includes('cvc')
  ) {
    return generateCreditCard();
  }

  // Coupon code fields
  if (
    fieldName.includes('coupon') ||
    fieldName.includes('promo') ||
    fieldName.includes('discount') ||
    placeholder.includes('coupon') ||
    placeholder.includes('promo')
  ) {
    return generateCouponCode();
  }

  // Date fields
  if (fieldType === 'date' || fieldName.includes('date')) {
    return generateDate();
  }

  // Text fields - use descriptive placeholder or generic text
  if (placeholder) {
    return `Test ${placeholder}`;
  }

  if (fieldName) {
    return `Test ${fieldName}`;
  }

  return 'Test Value';
}

/**
 * Generates a test email address.
 *
 * @returns Test email address
 */
export function generateEmail(): string {
  return 'test.user@example.com';
}

/**
 * Generates a secure test password.
 *
 * @returns Test password
 */
export function generatePassword(): string {
  return 'TestPassword123!';
}

/**
 * Generates a test phone number.
 *
 * @returns Test phone number
 */
export function generatePhone(): string {
  return '+1-555-123-4567';
}

/**
 * Generates a test credit card number (Visa test card).
 *
 * @returns Test credit card number
 */
export function generateCreditCard(): string {
  return '4111111111111111';
}

/**
 * Generates a test coupon code.
 *
 * @returns Test coupon code
 */
export function generateCouponCode(): string {
  return 'TESTCOUPON';
}

/**
 * Generates a test date (future date).
 *
 * @returns Test date in YYYY-MM-DD format
 */
export function generateDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1); // One month from now
  return date.toISOString().split('T')[0];
}

/**
 * Generates complete test data object for a form or test case.
 *
 * @param fields - Array of input fields to generate test data for
 * @returns TestData object with generated values
 */
export function generateTestData(fields: InputField[]): TestData {
  const testData: TestData = {};

  for (const field of fields) {
    const value = generateTestDataForField(field);
    const fieldName = field.name?.toLowerCase() || '';
    const fieldType = field.type.toLowerCase();

    if (fieldType === 'email' || fieldName.includes('email')) {
      testData.email = value;
    } else if (fieldType === 'password' || fieldName.includes('password')) {
      testData.password = value;
    } else if (fieldType === 'tel' || fieldName.includes('phone')) {
      testData.phone = value;
    } else if (fieldName.includes('card') || fieldName.includes('credit')) {
      testData.creditCard = value;
    } else if (fieldName.includes('coupon') || fieldName.includes('promo')) {
      testData.couponCode = value;
    } else if (fieldType === 'date' || fieldName.includes('date')) {
      testData.date = value;
    } else {
      // Store in custom for other fields
      if (!testData.custom) {
        testData.custom = {};
      }
      testData.custom[field.name || 'field'] = value;
    }
  }

  return testData;
}

