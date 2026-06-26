import { render, screen } from '@testing-library/react';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders a localized status text', () => {
    render(<StatusBadge value="PENDING" />);

    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it.each([
    ['DECLINED', 'Abgelehnt', 'danger'],
    ['voided', 'Beendet', 'danger'],
    ['SIGNED', 'Signiert', 'success'],
    ['accepted', 'Angenommen', 'success'],
    ['executed', 'Ausgeführt', 'success'],
    ['PENDING', 'Offen', 'neutral'],
  ])('uses the expected tone for %s', (value, label, tone) => {
    render(<StatusBadge value={value} />);

    expect(screen.getByText(label)).toHaveClass('status-badge', tone);
  });
});
