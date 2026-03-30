import { render, screen } from '@testing-library/react';
import GraphToolbar from './GraphToolbar';

describe('GraphToolbar', () => {
  test('shows display-offset graph counts in the toolbar', () => {
    render(<GraphToolbar mode="explore" nodeCount={10} edgeCount={12} />);

    expect(screen.getByText('Explore Mode')).toBeInTheDocument();
    expect(screen.getByText('510 nodes')).toBeInTheDocument();
    expect(screen.getByText('7012 edges')).toBeInTheDocument();
  });
});
