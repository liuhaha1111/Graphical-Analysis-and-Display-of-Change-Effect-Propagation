import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { WorkspaceProvider, useWorkspace } from './workspaceStore';

const providerWrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkspaceProvider>{children}</WorkspaceProvider>
);

test('provides a shared workspace seeded with parameter links and supply routes', () => {
  const { result } = renderHook(() => useWorkspace(), { wrapper: providerWrapper });

  expect(result.current.state.product.components.length).toBeGreaterThan(0);
  expect(result.current.state.product.parameterLinks.some((link) => link.id === 'link_cpu_freq_battery')).toBe(true);
  expect(result.current.state.supplyChain.routes.some((route) => route.id === 'route_chip_to_board')).toBe(true);
  expect(result.current.state.analysis).toBeNull();
});

test('useWorkspace throws when not inside a WorkspaceProvider', () => {
  expect(() => renderHook(() => useWorkspace())).toThrow('useWorkspace must be used within a WorkspaceProvider');
});

test('updates from one consumer propagate to another through the provider', () => {
  const { result } = renderHook(() => {
    const first = useWorkspace();
    const second = useWorkspace();
    return { first, second };
  }, { wrapper: providerWrapper });

  act(() => {
    result.current.first.setState((prev) => ({
      ...prev,
      changeScenario: { ...prev.changeScenario, rationale: 'Shared update' },
    }));
  });

  expect(result.current.second.state.changeScenario.rationale).toBe('Shared update');
});
