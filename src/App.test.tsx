import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the product modeling page by default', () => {
  render(<App />);

  expect(
    screen.getByRole('heading', {
      name: '\u4ea7\u54c1\u7ed3\u6784\u5efa\u6a21',
    }),
  ).toBeInTheDocument();
  expect(screen.getByText('\u4ea7\u54c1\u7ed3\u6784\u6811')).toBeInTheDocument();
});

test('switches between the three shared-model pages', () => {
  render(<App />);

  fireEvent.click(
    screen.getByRole('tab', {
      name: '\u4ea7\u54c1\u8bbe\u8ba1\u77e5\u8bc6\u56fe\u8c31',
    }),
  );
  expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('tab', {
      name: '\u53d8\u66f4\u6548\u5e94\u4f20\u64ad\u53ef\u89c6\u5316',
    }),
  );
  expect(screen.getByTestId('propagation-waiting-state')).toBeInTheDocument();
});
