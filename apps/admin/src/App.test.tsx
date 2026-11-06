import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('admin app', () => {
  it('renders its title and a navigation region', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /commerce admin/i })).toBeTruthy();
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('links to the configured API health endpoint', () => {
    render(<App apiBaseUrl="https://api.example.test" />);

    expect(screen.getByRole('link', { name: /api health/i }).getAttribute('href')).toBe(
      'https://api.example.test/health/live',
    );
  });
});
