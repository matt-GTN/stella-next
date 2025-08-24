# Design Document

## Overview

This design enhances the AgentDecisionDAG component to provide superior visual clarity while maintaining the existing backend logic and highlighting functionality. The improvements focus on curved path rendering, better content display, improved spacing, and overall visual polish.

## Architecture

### Component Structure
The design maintains the existing component architecture:
- `AgentDecisionDAG.js` - Main visualization component
- `langsmithTransformer.js` - Data transformation for LangSmith format
- `workflowTransformer.js` - Legacy workflow data transformation

### Key Design Principles
1. **Preserve Existing Logic**: Keep all current backend highlighting and path detection logic intact
2. **Progressive Enhancement**: Improve visual presentation without breaking functionality
3. **Responsive Design**: Ensure improvements work across different screen sizes
4. **Performance**: Maintain smooth animations and rendering performance

## Components and Interfaces

### Enhanced Node Component

#### Node Content Display
- **Agent Nodes**: Display actual user query content instead of generic labels
- **Tool Execution Nodes**: Show specific tool names and key parameters
- **Preparation Nodes**: Use actual workflow node names
- **Content Truncation**: Smart truncation with tooltips for full content

#### Visual Improvements
- **Single Icon Policy**: One emoji per node, prioritized by relevance
- **Enhanced Styling**: Consistent rounded corners, subtle shadows, better typography
- **Dynamic Sizing**: Adjust node dimensions based on content length

#### Node Types and Styling
```javascript
const nodeStyles = {
  // Used/executed nodes - purple theme (current)
  executed: { 
    fill: "#a855f7", // purple-500
    stroke: "#c084fc", // purple-400
    textColor: "#ffffff"
  },
  // Unused nodes - gray theme (current)
  unused: { 
    fill: "#6b7280", // gray-500
    stroke: "#9ca3af", // gray-400
    textColor: "#ffffff"
  }
}
```

### Enhanced Edge Component

#### Curved Path Generation
- **Vertical Connections**: Use smooth S-curves with control points
- **Horizontal Connections**: Gentle bezier curves for natural flow
- **Branching Paths**: Smooth curved branches from single source to multiple targets
- **Path Consolidation**: Eliminate duplicate edges between same nodes

#### Path Calculation Functions
```javascript
// Vertical S-curve for same-column connections
function createVerticalCurve(x0, y0, x1, y1) {
  const midY = (y0 + y1) / 2;
  const controlOffset = Math.abs(y1 - y0) * 0.3;
  return `M ${x0},${y0} C ${x0},${y0 + controlOffset} ${x1},${y1 - controlOffset} ${x1},${y1}`;
}

// Horizontal curve for side-by-side connections
function createHorizontalCurve(x0, y0, x1, y1) {
  const midX = (x0 + x1) / 2;
  const controlOffset = Math.abs(x1 - x0) * 0.3;
  return `M ${x0},${y0} C ${x0 + controlOffset},${y0} ${x1 - controlOffset},${y1} ${x1},${y1}`;
}

// Branching curve for one-to-many connections
function createBranchingCurve(x0, y0, x1, y1) {
  const verticalOffset = Math.abs(y1 - y0) * 0.4;
  const horizontalOffset = Math.abs(x1 - x0) * 0.2;
  return `M ${x0},${y0} C ${x0},${y0 + verticalOffset} ${x1 - horizontalOffset},${y1 - verticalOffset} ${x1},${y1}`;
}
```

### Layout and Positioning System

#### Improved Spacing Algorithm
- **Horizontal Spacing**: Minimum 200px between nodes in preparation layer
- **Vertical Spacing**: Minimum 120px between workflow layers
- **Detail Node Positioning**: 60px offset from parent nodes
- **Dynamic Adjustment**: Spacing adapts to content length and node count

#### Layout Configuration
```javascript
const layoutConfig = {
  nodeWidth: 160,
  nodeHeight: 70,
  minHorizontalSpacing: 200,
  minVerticalSpacing: 120,
  detailNodeOffset: 60,
  preparationLayerSpacing: 180,
  branchingVerticalOffset: 40
}
```

### Content Enhancement System

#### Smart Content Extraction
- **User Query Display**: Extract and display actual user queries from tool call arguments
- **Tool Parameter Display**: Show key parameters (ticker, symbol, etc.) in tool nodes
- **Workflow Node Names**: Use actual node IDs with proper formatting

#### Content Processing Functions
```javascript
function extractUserQuery(toolCalls, threadId) {
  // Extract user query from first tool call or thread context
  const firstTool = toolCalls?.[0];
  if (firstTool?.arguments?.ticker) {
    return `Analyze ${firstTool.arguments.ticker}`;
  }
  return threadId ? `Query: ${threadId}` : 'Financial Analysis';
}

function extractToolSummary(toolCalls) {
  if (!toolCalls?.length) return null;
  const toolNames = toolCalls.map(tc => tc.name).slice(0, 2);
  const mainArg = toolCalls[0]?.arguments?.ticker || toolCalls[0]?.arguments?.symbol;
  return {
    summary: `${toolCalls.length} tools: ${toolNames.join(', ')}`,
    target: mainArg
  };
}
```

## Data Models

### Enhanced Node Model
```javascript
interface EnhancedNode {
  id: string;
  type: NodeType;
  label: LocalizedLabel;
  icon: string; // Single emoji
  content?: {
    primary: string;    // Main display text
    secondary?: string; // Subtitle
    detail?: string;    // Additional info
  };
  styling: {
    fill: string;
    stroke: string;
    textColor: string;
  };
  position: Position;
  dimensions: {
    width: number;
    height: number;
  };
  executionState: ExecutionState;
}
```

### Enhanced Edge Model
```javascript
interface EnhancedEdge {
  id: string;
  from: string;
  to: string;
  pathData: string; // SVG path with curves
  styling: {
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    markerEnd?: string;
  };
  executionState: ExecutionState;
  curveType: 'vertical' | 'horizontal' | 'branching';
}
```

## Error Handling

### Graceful Degradation
- **Missing Content**: Fall back to node IDs if content extraction fails
- **Invalid Positions**: Use default layout if position calculation fails
- **Curve Generation Errors**: Fall back to straight lines if curve calculation fails
- **Icon Resolution**: Use default icons if specific icons are unavailable

### Error Recovery Strategies
```javascript
function safeContentExtraction(node, fallback) {
  try {
    return extractNodeContent(node);
  } catch (error) {
    console.warn(`Content extraction failed for ${node.id}:`, error);
    return fallback || node.id;
  }
}

function safeCurveGeneration(edge, fallback) {
  try {
    return generateCurvedPath(edge);
  } catch (error) {
    console.warn(`Curve generation failed for ${edge.id}:`, error);
    return fallback || generateStraightPath(edge);
  }
}
```

## Implementation Notes

### Color Consistency
- **Used Nodes**: All executed/used nodes maintain the current purple color scheme (#a855f7 fill, #c084fc stroke)
- **Unused Nodes**: All unused/inactive nodes maintain the current gray color scheme (#6b7280 fill, #9ca3af stroke)
- **No Type-Based Coloring**: Node colors are determined solely by execution state, not node type

### Backward Compatibility
- **Existing Logic**: All current backend highlighting and path detection logic remains unchanged
- **Data Formats**: Support both LangSmith and legacy workflow data formats
- **API Compatibility**: No changes to component props or external interfaces