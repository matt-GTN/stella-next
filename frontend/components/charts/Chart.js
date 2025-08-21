"use client";

import dynamic from "next/dynamic";
import { memo, useMemo } from "react";

// Dynamically import react-plotly.js to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function parsePlotlyJson(plotlyJson) {
  try {
    // plotlyJson comes from backend as a JSON string created by pio.to_json(fig)
    const obj = JSON.parse(plotlyJson);
    // react-plotly.js expects data and layout (and optionally frames, config)
    const { data = [], layout = {}, frames = [], config = {} } = obj;
    return { data, layout, frames, config };
  } catch (e) {
    console.error("Failed to parse plotly JSON:", e);
    return { data: [], layout: { title: "Erreur lors du rendu du graphique" } };
  }
}

function downloadPngFromPlotlyJson(plotlyJson) {
  try {
    const obj = JSON.parse(plotlyJson);
    const { data = [], layout = {} } = obj;
    const container = document.createElement('div');
    document.body.appendChild(container);
    import('plotly.js-dist-min').then(Plotly => {
      Plotly.newPlot(container, data, layout, { responsive: false }).then(() => {
        Plotly.toImage(container, { format: 'png', width: 1200, height: 800 }).then((url) => {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'stella_chart.png';
          a.click();
          Plotly.purge(container);
          container.remove();
        });
      });
    });
  } catch (e) {
    console.error('Failed to export PNG:', e);
  }
}

function Chart({ plotlyJson, registerDownloader }) {
  const parsed = useMemo(() => parsePlotlyJson(plotlyJson), [plotlyJson]);

  // Expose a downloader function to parent if requested
  if (registerDownloader) {
    try {
      registerDownloader(() => downloadPngFromPlotlyJson(plotlyJson));
    } catch (_) {}
  }

  return (
    <div 
      className="w-full relative z-0" 
      style={{ 
        contain: 'layout style paint',
        height: '400px',
        minHeight: '400px'
      }}
    >
      <Plot
        data={parsed.data}
        layout={{
          ...parsed.layout,
          autosize: true,
          height: 400,
          width: undefined,  // Let container control width
          margin: parsed.layout?.margin || { t: 40, r: 20, b: 40, l: 50 },
          paper_bgcolor: 'rgba(0,0,0,0)', // Background transparent
          plot_bgcolor: 'rgba(0,0,0,0)',  // Zone de plot transparente
        }}
        config={{ 
          displayModeBar: false, 
          displaylogo: false, 
          responsive: true, 
          staticPlot: false,
          doubleClick: false,
          showTips: false,
          ...parsed.config 
        }}
        frames={parsed.frames}
        style={{ 
          width: "100%", 
          height: "400px", 
          position: "relative", 
          zIndex: 1
        }}
        useResizeHandler
        className="w-full relative z-0"
      />
    </div>
  );
}

export default memo(Chart);

