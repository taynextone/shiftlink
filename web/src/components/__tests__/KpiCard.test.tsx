import { render, screen } from '@testing-library/react';

import { KpiCard } from '../KpiCard';

describe('KpiCard', () => {
  it('renders the KPI label, value, and helper text', () => {
    render(<KpiCard label="Open shifts" value="12" helper="3 require action today" />);

    expect(screen.getByText('Open shifts')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 require action today')).toBeInTheDocument();
  });

  it('groups the KPI content as an article', () => {
    render(<KpiCard label="Conversion" value="68%" helper="Accepted offers" />);

    expect(screen.getByRole('article')).toHaveTextContent('Conversion');
    expect(screen.getByRole('article')).toHaveTextContent('68%');
    expect(screen.getByRole('article')).toHaveTextContent('Accepted offers');
  });
});
