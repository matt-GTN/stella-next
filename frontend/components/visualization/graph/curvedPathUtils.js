/**
 * Curved Path Generation Utilities
 * 
 * This module provides utility functions for generating smooth curved SVG paths
 * for the graph visualization system. It supports different types of curves
 * based on node positioning and connection patterns.
 */

/**
 * Generate a smooth vertical S-curve for same-column node connections
 * Used when nodes are vertically aligned (same or similar X coordinates)
 * 
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate  
 * @param {number} x1 - Ending X coordinate
 * @param {number} y1 - Ending Y coordinate
 * @returns {string} SVG path string for vertical S-curve
 */
export function createVerticalCurve(x0, y0, x1, y1) {
  const midY = (y0 + y1) / 2;
  const controlOffset = Math.abs(y1 - y0) * 0.3;
  
  // Ensure minimum control offset for very close nodes
  const minOffset = 20;
  const actualOffset = Math.max(controlOffset, minOffset);
  
  return `M ${x0},${y0} C ${x0},${y0 + actualOffset} ${x1},${y1 - actualOffset} ${x1},${y1}`;
}

/**
 * Generate a smooth horizontal curve for side-by-side node connections
 * Used when nodes are horizontally aligned (same or similar Y coordinates)
 * 
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate
 * @param {number} x1 - Ending X coordinate  
 * @param {number} y1 - Ending Y coordinate
 * @returns {string} SVG path string for horizontal curve
 */
export function createHorizontalCurve(x0, y0, x1, y1) {
  const midX = (x0 + x1) / 2;
  const controlOffset = Math.abs(x1 - x0) * 0.3;
  
  // Ensure minimum control offset for very close nodes
  const minOffset = 30;
  const actualOffset = Math.max(controlOffset, minOffset);
  
  return `M ${x0},${y0} C ${x0 + actualOffset},${y0} ${x1 - actualOffset},${y1} ${x1},${y1}`;
}

/**
 * Generate a smooth branching curve for one-to-many connections
 * Used when one node connects to multiple nodes (branching pattern)
 * 
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate
 * @param {number} x1 - Ending X coordinate
 * @param {number} y1 - Ending Y coordinate
 * @returns {string} SVG path string for branching curve
 */
export function createBranchingCurve(x0, y0, x1, y1) {
  const verticalOffset = Math.abs(y1 - y0) * 0.4;
  const horizontalOffset = Math.abs(x1 - x0) * 0.2;
  
  // Ensure minimum offsets for smooth curves
  const minVerticalOffset = 30;
  const minHorizontalOffset = 20;
  const actualVerticalOffset = Math.max(verticalOffset, minVerticalOffset);
  const actualHorizontalOffset = Math.max(horizontalOffset, minHorizontalOffset);
  
  return `M ${x0},${y0} C ${x0},${y0 + actualVerticalOffset} ${x1 - actualHorizontalOffset},${y1 - actualVerticalOffset} ${x1},${y1}`;
}

/**
 * Determine the appropriate curve type based on node positions
 * Analyzes the relative positions of two nodes to select the best curve type
 * 
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate
 * @param {number} x1 - Ending X coordinate
 * @param {number} y1 - Ending Y coordinate
 * @param {Object} options - Additional options for curve selection
 * @param {boolean} options.isDetailEdge - Whether this is a detail connection
 * @param {number} options.verticalThreshold - Threshold for considering nodes vertically aligned (default: 50)
 * @param {number} options.horizontalThreshold - Threshold for considering nodes horizontally aligned (default: 30)
 * @returns {string} Curve type: 'vertical', 'horizontal', or 'branching'
 */
export function determineCurveType(x0, y0, x1, y1, options = {}) {
  const {
    isDetailEdge = false,
    verticalThreshold = 50,
    horizontalThreshold = 30
  } = options;
  
  // Detail edges are always horizontal
  if (isDetailEdge) {
    return 'horizontal';
  }
  
  const deltaX = Math.abs(x1 - x0);
  const deltaY = Math.abs(y1 - y0);
  
  // Check if nodes are vertically aligned (same or close X coordinates)
  if (deltaX < verticalThreshold) {
    return 'vertical';
  }
  
  // Check if nodes are horizontally aligned (same or close Y coordinates)
  if (deltaY < horizontalThreshold) {
    return 'horizontal';
  }
  
  // Default to branching for diagonal connections
  return 'branching';
}

/**
 * Generate a curved path based on automatic curve type detection
 * This is the main function that combines curve type detection with path generation
 * 
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate
 * @param {number} x1 - Ending X coordinate
 * @param {number} y1 - Ending Y coordinate
 * @param {Object} options - Options for curve generation
 * @param {boolean} options.isDetailEdge - Whether this is a detail connection
 * @param {string} options.forceCurveType - Force a specific curve type ('vertical', 'horizontal', 'branching')
 * @returns {string} SVG path string for the appropriate curve
 */
export function generateCurvedPath(x0, y0, x1, y1, options = {}) {
  const { forceCurveType, ...curveOptions } = options;
  
  // Use forced curve type if provided, otherwise auto-detect
  const curveType = forceCurveType || determineCurveType(x0, y0, x1, y1, curveOptions);
  
  switch (curveType) {
    case 'vertical':
      return createVerticalCurve(x0, y0, x1, y1);
    case 'horizontal':
      return createHorizontalCurve(x0, y0, x1, y1);
    case 'branching':
      return createBranchingCurve(x0, y0, x1, y1);
    default:
      // Fallback to vertical curve
      return createVerticalCurve(x0, y0, x1, y1);
  }
}

/**
 * Generate a curved path for edge objects with position data
 * Convenience function that works with edge objects containing position information
 * 
 * @param {Object} edge - Edge object with position data
 * @param {Object} fromPos - Starting position {x, y, w, h}
 * @param {Object} toPos - Ending position {x, y, w, h}
 * @param {Object} options - Options for curve generation
 * @returns {string} SVG path string for the curved edge
 */
export function generateEdgePath(edge, fromPos, toPos, options = {}) {
  if (!fromPos || !toPos) {
    console.warn('Missing position data for edge:', edge.id);
    return '';
  }
  
  // Calculate connection points based on node positions
  let x0, y0, x1, y1;
  
  if (options.isDetailEdge || edge.isDetailEdge) {
    // Detail edges connect from right side of source to left side of target
    x0 = fromPos.x + fromPos.w;
    y0 = fromPos.y + fromPos.h / 2;
    x1 = toPos.x;
    y1 = toPos.y + toPos.h / 2;
  } else {
    // Regular edges connect from bottom center of source to top center of target
    x0 = fromPos.x + fromPos.w / 2;
    y0 = fromPos.y + fromPos.h;
    x1 = toPos.x + toPos.w / 2;
    y1 = toPos.y;
  }
  
  return generateCurvedPath(x0, y0, x1, y1, {
    ...options,
    isDetailEdge: options.isDetailEdge || edge.isDetailEdge
  });
}

/**
 * Batch generate curved paths for multiple edges
 * Efficiently processes multiple edges at once
 * 
 * @param {Array} edges - Array of edge objects
 * @param {Object} positions - Position lookup object {nodeId: {x, y, w, h}}
 * @param {Object} options - Global options for all edges
 * @returns {Array} Array of edges with generated path data
 */
export function generateAllCurvedPaths(edges, positions, options = {}) {
  return edges.map(edge => {
    const fromPos = positions[edge.from];
    const toPos = positions[edge.to];
    
    if (!fromPos || !toPos) {
      console.warn('Missing position data for edge:', edge.from, '->', edge.to);
      return { ...edge, d: '' };
    }
    
    const pathData = generateEdgePath(edge, fromPos, toPos, options);
    
    return {
      ...edge,
      d: pathData,
      curveType: determineCurveType(
        fromPos.x + fromPos.w / 2,
        fromPos.y + fromPos.h,
        toPos.x + toPos.w / 2,
        toPos.y,
        { isDetailEdge: edge.isDetailEdge, ...options }
      )
    };
  });
}