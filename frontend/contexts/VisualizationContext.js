"use client";

import { createContext, useContext, useState } from 'react';

const VisualizationContext = createContext({
  isSidePanelOpen: false,
  setIsSidePanelOpen: () => {},
});

export function VisualizationProvider({ children }) {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <VisualizationContext.Provider value={{ isSidePanelOpen, setIsSidePanelOpen }}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualization() {
  return useContext(VisualizationContext);
}
