# Requirements Document

## Introduction

This feature aims to enhance the visual clarity and user experience of the agent decision graph visualization. The current implementation works well functionally with correct path highlighting, but needs improvements in visual presentation, spacing, path rendering, and content display to provide better clarity for users analyzing the agent workflow.

## Requirements

### Requirement 1

**User Story:** As a user analyzing agent workflows, I want to see curved, smooth paths instead of angular connections, so that the graph appears more professional and easier to follow visually.

#### Acceptance Criteria

1. WHEN the graph is rendered THEN all edges SHALL use smooth curved paths instead of angular lines
2. WHEN connecting nodes vertically THEN the system SHALL use smooth S-curves or bezier curves
3. WHEN connecting nodes horizontally THEN the system SHALL use gentle curved connections
4. WHEN branching from one node to multiple nodes THEN the system SHALL create smooth curved branches

### Requirement 2

**User Story:** As a user viewing the graph, I want to see actual node names and content instead of simplified labels, so that I can understand exactly what each step represents.

#### Acceptance Criteria

1. WHEN displaying the agent node THEN the system SHALL show the actual user query inside the node instead of "Requête utilisateur"
2. WHEN displaying tool execution nodes THEN the system SHALL show the actual tool names and parameters inside the node instead of "Outils exécutés"
3. WHEN displaying preparation nodes THEN the system SHALL show the actual node names from the workflow
4. WHEN node content is too long THEN the system SHALL truncate appropriately with ellipsis

### Requirement 3

**User Story:** As a user examining the workflow graph, I want better spacing between nodes especially in dense areas, so that I can clearly distinguish between different workflow steps.

#### Acceptance Criteria

1. WHEN rendering the preparation layer (réponse finale, etc.) THEN the system SHALL provide adequate horizontal spacing between nodes
2. WHEN displaying detail nodes THEN the system SHALL position them with sufficient spacing from parent nodes
3. WHEN the graph has multiple layers THEN the system SHALL ensure adequate vertical spacing between layers
4. WHEN nodes have varying content lengths THEN the system SHALL adjust spacing to prevent overlap

### Requirement 4

**User Story:** As a user viewing the graph, I want to see single, clean icons for each node type, so that the visual representation is consistent and not cluttered.

#### Acceptance Criteria

1. WHEN displaying node icons THEN the system SHALL show only one emoji per node
2. WHEN a node has multiple icon sources THEN the system SHALL prioritize and display the most appropriate single icon
3. WHEN icons are missing THEN the system SHALL use appropriate default icons based on node type
4. WHEN rendering icons THEN the system SHALL ensure consistent sizing and positioning

### Requirement 5

**User Story:** As a user analyzing the workflow, I want to eliminate duplicate paths in the visualization, so that the graph is clean and easy to follow.

#### Acceptance Criteria

1. WHEN multiple edges connect the same nodes THEN the system SHALL consolidate them into a single path
2. WHEN edge duplication occurs THEN the system SHALL preserve the most relevant edge properties
3. WHEN consolidating edges THEN the system SHALL maintain correct highlighting and execution status
4. WHEN rendering consolidated edges THEN the system SHALL ensure visual consistency

### Requirement 6

**User Story:** As a user viewing the graph, I want additional visual clarity improvements, so that the overall graph is more professional and easier to understand.

#### Acceptance Criteria

1. WHEN rendering nodes THEN the system SHALL use consistent rounded corners and shadows for depth
2. WHEN displaying text THEN the system SHALL ensure proper contrast and readability
3. WHEN highlighting execution paths THEN the system SHALL use distinct visual treatments
4. WHEN showing unused paths THEN the system SHALL use subtle styling to indicate their inactive state
5. WHEN rendering the overall graph THEN the system SHALL maintain the current backend highlighting logic