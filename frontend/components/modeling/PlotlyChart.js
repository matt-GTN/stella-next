"use client";

import { useEffect, useRef } from 'react';

export default function PlotlyChart({ 
  data, 
  layout = {}, 
  config = {},
  className = "w-full h-64",
  onReady = () => {}
}) {
  const plotRef = useRef(null);
  const plotlyRef = useRef(null);

  useEffect(() => {
    let plotlyModule = null;

    const loadPlotly = async () => {
      if (typeof window !== 'undefined' && !plotlyRef.current) {
        try {
          // Import Plotly dynamically to avoid SSR issues
          const Plotly = await import('plotly.js-dist-min');
          plotlyRef.current = Plotly.default;
          plotlyModule = Plotly.default;
        } catch (error) {
          console.error('Failed to load Plotly:', error);
          return;
        }
      } else {
        plotlyModule = plotlyRef.current;
      }

      if (plotlyModule && plotRef.current && data) {
        // Default layout configuration
        const defaultLayout = {
          margin: { l: 60, r: 30, t: 40, b: 60 },
          font: { family: 'Arial, sans-serif', size: 12 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          ...layout
        };

        // Default config
        const defaultConfig = {
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
          responsive: true,
          ...config
        };

        try {
          await plotlyModule.newPlot(plotRef.current, data, defaultLayout, defaultConfig);
          onReady();
        } catch (error) {
          console.error('Error creating Plotly chart:', error);
        }
      }
    };

    loadPlotly();

    // Cleanup function
    return () => {
      if (plotlyModule && plotRef.current) {
        plotlyModule.purge(plotRef.current);
      }
    };
  }, [data, layout, config, onReady]);

  return (
    <div className={className}>
      <div ref={plotRef} className="w-full h-full" />
    </div>
  );
}
