import { describe, it, expect } from 'vitest';
import { getTier } from './tiers';

describe('getTier', () => {
  it('returns LEGEND at 75%+ of max', () => {
    expect(getTier(1500, 2000).label).toBe('LEGEND');
  });
  it('returns ELITE between 50-75%', () => {
    expect(getTier(1000, 2000).label).toBe('ELITE');
  });
  it('returns PRO between 25-50%', () => {
    expect(getTier(500, 2000).label).toBe('PRO');
  });
  it('returns ROOKIE below 25%', () => {
    expect(getTier(100, 2000).label).toBe('ROOKIE');
  });
  it('handles zero maxScore', () => {
    expect(getTier(0, 0).label).toBe('ROOKIE');
  });
  it('returns LEGEND at exact 75%', () => {
    expect(getTier(1500, 2000).label).toBe('LEGEND');
  });
});
