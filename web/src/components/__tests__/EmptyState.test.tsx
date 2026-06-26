import { render, screen } from '@testing-library/react';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(<EmptyState title="No offers yet" description="New matches will appear here." />);

    expect(screen.getByText('No offers yet')).toBeInTheDocument();
    expect(screen.getByText('New matches will appear here.')).toBeInTheDocument();
  });

  it('uses accessible text content without extra controls', () => {
    render(<EmptyState title="Nothing scheduled" description="Add availability to receive matches." />);

    expect(screen.getByText('Nothing scheduled')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
