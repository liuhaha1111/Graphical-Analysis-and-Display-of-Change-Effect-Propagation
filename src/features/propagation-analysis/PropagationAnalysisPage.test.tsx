import { fireEvent, render, screen } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import PropagationAnalysisPage from './PropagationAnalysisPage';

describe('PropagationAnalysisPage', () => {
  test('shows waiting state before analysis and graph-first topology after analysis', () => {
    render(
      <WorkspaceProvider>
        <PropagationAnalysisPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByText(/waiting for analysis/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp('\\u6267\\u884c\\u4f20\\u64ad\\u5206\\u6790', 'i'),
      }),
    );

    expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();
    expect(screen.getByText(/Impact Summary/i)).toBeInTheDocument();
    expect(screen.getByTestId('impact-summary-risk-level')).toBeInTheDocument();
    expect(screen.getByTestId('impact-summary-metric-affected-nodes')).toBeInTheDocument();
    expect(screen.getByTestId('impact-summary-metric-overall-score')).toBeInTheDocument();
    expect(screen.getByTestId('impact-summary-metric-cost-risk')).toBeInTheDocument();
    expect(screen.getByTestId('impact-summary-metric-schedule-risk')).toBeInTheDocument();
  });
});
