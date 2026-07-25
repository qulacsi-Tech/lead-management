import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidMobile, required } from './validate';

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('jane@example.com')).toBe(true);
  });
  it('rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidMobile', () => {
  it('accepts exactly 10 digits', () => {
    expect(isValidMobile('9876543210')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isValidMobile('12345')).toBe(false);
    expect(isValidMobile('98765432101')).toBe(false);
    expect(isValidMobile('abcdefghij')).toBe(false);
  });
});

describe('required', () => {
  it('rejects empty/whitespace values', () => {
    expect(required('')).toBe(false);
    expect(required('   ')).toBe(false);
  });
  it('accepts non-empty values', () => {
    expect(required('Jane')).toBe(true);
  });
});
