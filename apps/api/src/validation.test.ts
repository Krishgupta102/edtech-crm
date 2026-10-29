import test from 'node:test';
import assert from 'node:assert/strict';
import { inquirySchema, loginSchema } from './validation';

const validInquiry = {
  name: 'Riya Sharma', email: 'riya@example.com', phone: '+91 98765 43210',
  userType: 'Parent', category: 'Admission', message: 'I would like to learn about next term admissions.',
};

test('accepts a complete inquiry and trims whitespace', () => {
  const parsed = inquirySchema.parse({ ...validInquiry, name: '  Riya Sharma  ' });
  assert.equal(parsed.name, 'Riya Sharma');
});

test('rejects unsupported user types and categories', () => {
  assert.equal(inquirySchema.safeParse({ ...validInquiry, userType: 'Teacher' }).success, false);
  assert.equal(inquirySchema.safeParse({ ...validInquiry, category: 'Other' }).success, false);
});

test('rejects incomplete or malformed inquiry details', () => {
  assert.equal(inquirySchema.safeParse({ ...validInquiry, email: 'not-an-email' }).success, false);
  assert.equal(inquirySchema.safeParse({ ...validInquiry, message: 'short' }).success, false);
  assert.equal(inquirySchema.safeParse({ ...validInquiry, phone: '123' }).success, false);
});

test('accepts valid login credentials and rejects invalid email', () => {
  assert.equal(loginSchema.safeParse({ email: 'admin@example.com', password: 'a-long-password' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'bad-email', password: 'a-long-password' }).success, false);
});
