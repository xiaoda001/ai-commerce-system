import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('storefront home page', () => {
  it('offers links for both supported markets', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /United States/i }).getAttribute('href')).toBe('/us');
    expect(screen.getByRole('link', { name: /China/i }).getAttribute('href')).toBe('/cn');
  });
});
