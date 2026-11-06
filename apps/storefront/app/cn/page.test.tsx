import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChinaPage from './page';

describe('China market route', () => {
  it('renders a market shell for the CN link destination', () => {
    render(<ChinaPage />);

    expect(screen.getByRole('heading', { name: /好物/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /登录/i }).getAttribute('href')).toBe('/cn/login');
  });
});
