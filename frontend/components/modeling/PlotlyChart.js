"use client";

import { useEffect, useRef, useState, useMemo } from 'react';

// Plotly instance cache to avoid multiple imports
let plotlyInstance = null;
const plotlyPromise = typeof window !== 'undefined' ? null : Promise.resolve(null);

export default function PlotlyChart({ 
  data, 
  layout = {}, 
  config = {},
  className = "w-full h-64",
  onReady = () => {},
  ariaLabel,
  ariaDescription
}) {
  const plotRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize layout and config to prevent unnecessary re-renders
  const memoizedLayout = useMemo(() => ({
    margin: { l: 60, r: 30, t: 40, b: 60 },
    font: { family: 'Arial, sans-serif', size: 12 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    ...layout
  }), [layout]);

  const memoizedConfig = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
    responsive: true,
    ...config
  }), [config]);

  useEffect(() => {
    const loadPlotly = async () => {
      if (typeof window === 'undefined') return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Use cached instance if available
        if (!plotlyInstance) {
          const Plotly = await import('plotly.js-dist-min');
          plotlyInstance = Plotly.default;
        }

        if (plotlyInstance && plotRef.current && data) {
          // Create the plot with optimized settings
          await plotlyInstance.newPlot(
            plotRef.current, 
            data, 
            memoizedLayout, 
            memoizedConfig
          );
          
          setIsLoading(false);
          onReady();
        }
      } catch (error) {
        console.error('Error loading or creating Plotly chart:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    loadPlotly();

    // Cleanup function
    return () => {
      if (plotlyInstance && plotRef.current) {
        try {
          plotlyInstance.purge(plotRef.current);
        } catch (error) {
          console.warn('Error purging Plotly chart:', error);
        }
      }
    };
  }, [data, memoizedLayout, memoizedConfig, onReady]);

  return (
    <div className={className}>
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="text-sm text-gray-600">Loading chart...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-red-700">Failed to load chart</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div 
        ref={plotRef} 
        className={`w-full h-full ${isLoading || error ? 'hidden' : ''}`}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `plotly-desc-${Math.random().toString(36).substr(2, 9)}` : undefined}
      />
      
      {ariaDescription && !isLoading && !error && (
        <div 
          id={`plotly-desc-${Math.random().toString(36).substr(2, 9)}`}
          className="sr-only"
        >
          {ariaDescription}
        </div>
      )}
    </div>
  );
}
