import { render, screen } from '@testing-library/react';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the provided status text', () => {
    render(<StatusBadge value="PENDING" />);

    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it.each([
    ['DECLINED', 'danger'],
    ['voided', 'danger'],
    ['SIGNED', 'success'],
    ['accepted', 'success'],
    ['executed', 'success'],
    ['PENDING', 'neutral'],
  ])('uses the expected tone for %s', (value, tone) => {
    render(<StatusBadge value={value} />);

    expect(screen.getByText(value)).toHaveClass('status-badge', tone);
  });
});
