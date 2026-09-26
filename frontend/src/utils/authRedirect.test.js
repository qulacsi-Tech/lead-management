import { describe, expect, it } from 'vitest';
import { afterSignIn, authPath, safeNext } from './authRedirect';

describe('safeNext', () => {
  it('accepts a path on this site', () => {
    expect(safeNext('/college/sait/indore?tab=job#apply')).toBe('/college/sait/indore?tab=job#apply');
  });

  it('rejects anything that could leave the site', () => {
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('/\\evil.example')).toBeNull();
    expect(safeNext('javascript:alert(1)')).toBeNull();
    expect(safeNext(null)).toBeNull();
  });

  it('never points back at the auth pages', () => {
    expect(safeNext('/login')).toBeNull();
    expect(safeNext('/signup?next=/feed')).toBeNull();
  });
});

describe('authPath', () => {
  it('carries the return path and reason', () => {
    expect(authPath('/login', { next: '/feed', reason: 'Sign in to like this.' }))
      .toBe('/login?next=%2Ffeed&reason=Sign+in+to+like+this.');
  });

  it('drops the landing page as a return path, since it forwards on its own', () => {
    expect(authPath('/login', { next: '/' })).toBe('/login');
  });
});

describe('afterSignIn', () => {
  it('prefers the page the visitor came from', () => {
    expect(afterSignIn('student', '/school/dps/bhopal')).toBe('/school/dps/bhopal');
  });

  it('falls back to the role home', () => {
    expect(afterSignIn('admin', null)).toBe('/admin');
    expect(afterSignIn('institute', null)).toBe('/institute');
    expect(afterSignIn('student', '//evil.example')).toBe('/feed');
  });
});
