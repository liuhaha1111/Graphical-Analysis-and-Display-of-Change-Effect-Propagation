import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { WorkspaceModel } from '../domain/workspace';
import { createDemoWorkspace } from '../data/demoWorkspace';

type WorkspaceContextValue = {
  state: WorkspaceModel;
  setState: React.Dispatch<React.SetStateAction<WorkspaceModel>>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<WorkspaceModel>(() => createDemoWorkspace());
  return <WorkspaceContext.Provider value={{ state, setState }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
