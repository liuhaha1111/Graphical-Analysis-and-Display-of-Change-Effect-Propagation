import AppShell from './app/AppShell';
import { WorkspaceProvider } from './store/workspaceStore';

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}
