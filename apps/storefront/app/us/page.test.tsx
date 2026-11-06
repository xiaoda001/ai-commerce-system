import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UnitedStatesPage from './page';

describe('United States market route', () => {
  it('renders a market shell for the US link destination', () => {
    render(<UnitedStatesPage />);

    expect(screen.getByRole('heading', { name: /United States/i })).toBeTruthy();
  });
});
