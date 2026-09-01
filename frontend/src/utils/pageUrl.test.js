import { describe, expect, it } from 'vitest';
import {
  pagePath,
  pageDisplayUrl,
  typeSegment,
  slugifySegment,
  isInstitutePath,
} from './pageUrl';

describe('pagePath', () => {
  it('builds the three-segment URL the client asked for', () => {
    expect(pagePath({ type: 'College', slug: 'sait', city: 'Indore' })).toBe('/college/sait/indore');
    expect(pagePath({ type: 'University', slug: 'medicaps-university', city: 'Indore' })).toBe(
      '/university/medicaps-university/indore',
    );
    expect(pagePath({ type: 'Coaching', slug: 'paras', city: 'Bhopal' })).toBe(
      '/coaching/paras/bhopal',
    );
  });

  it('prefers the backend-computed path over deriving one', () => {
    // The server is the authority; a stale local type/city must not win.
    expect(
      pagePath({ public_path: '/college/sait/indore', type: 'Coaching', slug: 'x', city: 'Pune' }),
    ).toBe('/college/sait/indore');
  });

  it('drops the city segment when the page has none, rather than emitting //', () => {
    expect(pagePath({ type: 'School', slug: 'st-marys', city: '' })).toBe('/school/st-marys');
    expect(pagePath({ type: 'School', slug: 'st-marys' })).toBe('/school/st-marys');
  });

  it('slugifies a multi-word city', () => {
    expect(pagePath({ type: 'Coaching', slug: 'aim', city: 'New Delhi' })).toBe(
      '/coaching/aim/new-delhi',
    );
  });

  it('returns a dead link, not the feed, when there is nothing to link to', () => {
    expect(pagePath(null)).toBe('#');
    expect(pagePath({ type: 'College' })).toBe('#');
  });
});

describe('typeSegment', () => {
  it('maps every institute type', () => {
    expect(typeSegment('Training Institute')).toBe('training-institute');
    expect(typeSegment('School')).toBe('school');
  });

  it('falls back to a slug for a type not in the map', () => {
    expect(typeSegment('Skill Centre')).toBe('skill-centre');
    expect(typeSegment('')).toBe('institute');
  });
});

describe('slugifySegment', () => {
  it('matches the backend rules', () => {
    expect(slugifySegment('  Sri Aurobindo  ')).toBe('sri-aurobindo');
    expect(slugifySegment('A.B.C. & Co.')).toBe('a-b-c-co');
  });
});

describe('pageDisplayUrl', () => {
  it('renders the host with the canonical path', () => {
    expect(pageDisplayUrl({ type: 'Coaching', slug: 'paras', city: 'Bhopal' })).toBe(
      'connectedus.in/coaching/paras/bhopal',
    );
  });
});

describe('isInstitutePath', () => {
  it('recognises institute pages in both forms', () => {
    expect(isInstitutePath('/college/sait/indore')).toBe(true);
    expect(isInstitutePath('/coaching/paras/bhopal')).toBe(true);
    expect(isInstitutePath('/training-institute/herald/gwalior')).toBe(true);
    expect(isInstitutePath('/school/st-marys')).toBe(true);
  });

  it('leaves app routes alone, so their chrome is untouched', () => {
    // This is what decides whether the member navigation renders, so a false
    // positive here would strip the nav off a real app screen.
    for (const path of ['/', '/profile', '/dashboard', '/search', '/admin/pages', '/page/edit']) {
      expect(isInstitutePath(path)).toBe(false);
    }
  });

  it('ignores paths with the wrong shape', () => {
    expect(isInstitutePath('/college')).toBe(false);
    expect(isInstitutePath('/college/sait/indore/extra')).toBe(false);
    expect(isInstitutePath('')).toBe(false);
  });
});
