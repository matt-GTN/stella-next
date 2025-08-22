# Stella Financial Analysis Platform

Advanced AI-powered financial analysis platform built with Next.js 15, featuring interactive workflow visualization, glassmorphic design, and intelligent agent reasoning display.

## ✨ Features

### 🎯 Core Platform Features
- **AI Agent Chat Interface**: Interactive chat with Stella AI for financial analysis
- **Real-time Tool Execution**: Live display of AI agent tool usage and reasoning
- **Financial Data Integration**: Stock analysis, news, company profiles, and risk assessment
- **Multi-language Support**: Complete French/English interface with context-aware translations
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Tech Stack**: Built with Next.js 15, React 19, Tailwind CSS, and Motion

### 🔄 Workflow Visualization System
- **Inline Graph Visualization**: Expandable workflow graphs within chat messages
- **Glassmorphic Design**: Transparent backgrounds with backdrop blur effects for modern aesthetics
- **Interactive Node System**: Click and hover interactions with detailed tool information
- **Real-time Execution Tracking**: Live updates showing current tool execution status
- **Advanced Animations**: Smooth transitions, pulsing effects, and flow particles
- **Keyboard Navigation**: Full accessibility with Tab, Arrow keys, and shortcuts
- **Performance Optimization**: Virtualization for large workflows (50+ tools)
- **Edge Case Handling**: Graceful handling of errors, concurrent executions, and complex flows
- **Responsive Layouts**: Adaptive positioning for different screen sizes
- **Tool Grouping**: Intelligent categorization by function (data acquisition, processing, visualization)

### 🛠️ Technical Capabilities
- **Pan & Zoom**: Smooth SVG-based navigation with touch support
- **State Management**: Advanced tracking of active, executed, and executing states
- **Error Recovery**: Network error handling with offline support and retry mechanisms
- **Data Validation**: Comprehensive input validation with fallback structures
- **Memoization**: Performance optimization through intelligent caching
- **Accessibility**: ARIA labels, screen reader support, and keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd portfolio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.4.3** - React framework with App Router and latest features
- **React 19.1.0** - Latest React with concurrent features and improved performance
- **Node.js** - JavaScript runtime environment

### Styling & UI
- **Tailwind CSS 4.1.11** - Utility-first CSS framework with PostCSS integration
- **DaisyUI 5.0.46** - Component library for Tailwind with carousel, badges, and more
- **Geist Font** - Modern typography (Sans & Mono variants)

### Animation & Effects
- **Motion 12.23.7** - Advanced animation library (Framer Motion successor)
- **Vanta.js 0.5.24** - 3D background effects with bird simulation
- **Three.js 0.125.2** - 3D graphics engine (Vanta dependency)
- **p5.js 2.0.3** - Creative coding library for additional effects

### Icons & Utilities
- **Lucide React 0.525.0** - Beautiful, customizable icon library
- **tailwind-merge 3.3.1** - Utility for merging Tailwind classes efficiently

### Internationalization & Search
- **Custom Translation System** - Complete French/English support with context-aware translations
- **Interactive Search** - Smart pill-based search functionality with Google and ChatGPT integration
- **Language Detection** - Automatic browser language detection with manual toggle

## 🎨 Graph Visualization System

The workflow visualization system is a sophisticated component that transforms backend AI agent tool calls into interactive, visually appealing graphs. This system provides complete transparency into Stella's reasoning process.

### Core Components

#### InlineGraphVisualization
The main container component that expands within chat messages:
```jsx
<InlineGraphVisualization
  toolCalls={toolExecutions}
  isExpanded={true}
  onToggle={() => setExpanded(!expanded)}
  language="en"
/>
```

#### GraphCanvas
SVG-based rendering engine with pan/zoom capabilities:
- **Interactive Navigation**: Mouse drag to pan, wheel to zoom
- **Touch Support**: Pinch-to-zoom and drag on mobile devices
- **Keyboard Controls**: WASD for pan, +/- for zoom, arrows for node navigation
- **Virtualization**: Automatic chunking for workflows with 50+ nodes

#### NodeRenderer
Renders individual workflow nodes with state-based styling:
- **Node Types**: Start (green), Agent (purple), Tools (blue), Preparation (orange), End (green)
- **State Animations**: Pulsing for executing, glow for active, checkmarks for completed
- **Tool Icons**: Specific icons for each tool type (🔍 for search, 📊 for data, etc.)
- **Responsive Sizing**: Adaptive dimensions for mobile, tablet, and desktop

#### EdgeRenderer
Creates smooth connections between nodes:
- **Path Types**: Straight lines, curved paths, and loop connections
- **Flow Animation**: Moving particles along active execution paths
- **Conditional Labels**: Display routing conditions and decision points
- **State Styling**: Different colors and styles for active/inactive/executed edges

### Workflow Node Types

| Type | Purpose | Visual Style | Examples |
|------|---------|--------------|----------|
| **Start** | Workflow entry point | Green gradient, smaller size | Workflow initialization |
| **Agent** | LLM decision making | Purple gradient, larger size | Tool selection, reasoning |
| **Tool** | Individual tool execution | Blue gradient, tool icons | search_ticker, fetch_data, analyze_risks |
| **Preparation** | Data processing | Orange gradient, system icons | generate_final_response, cleanup_state |
| **End** | Workflow completion | Green gradient, smaller size | Final result delivery |

### Tool Categories

Tools are automatically grouped by function for logical layout:

- **Data Acquisition** (Blue): search_ticker, fetch_data, get_stock_news, get_company_profile
- **Data Processing** (Purple): preprocess_data, analyze_risks
- **Visualization** (Orange): create_dynamic_chart, display_price_chart, compare_stocks
- **Data Display** (Green): display_raw_data, display_processed_data
- **Research** (Red): query_research

### Performance Features

- **Memoization**: Expensive calculations cached for repeated use
- **Virtualization**: Large workflows split into manageable chunks
- **Debounced Interactions**: Smooth 60fps pan/zoom operations
- **Lazy Loading**: Graph data loaded only when visualization expands
- **Error Boundaries**: Graceful fallback for rendering errors

### Accessibility Features

- **Keyboard Navigation**: Full workflow navigation without mouse
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **High Contrast**: Sufficient color contrast for all visual elements
- **Focus Management**: Clear focus indicators and logical tab order
- **Reduced Motion**: Respects user preferences for animation

## 📁 Project Structure

```
stella-frontend/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout with fonts and metadata
│   ├── page.js            # Main chat interface
│   ├── globals.css        # Global styles with Tailwind imports
│   ├── home/              # Landing page
│   ├── agent-visualization/ # Agent workflow visualization page
│   ├── modeling/          # Financial modeling interface
│   ├── research-report/   # Research report generation
│   └── api/               # API routes for chat and data
├── components/            # React components
│   ├── chat/             # Chat interface components
│   │   ├── ChatContainer.js     # Main chat container
│   │   ├── ChatMessage.js       # Individual message display
│   │   ├── ChatInput.js         # Message input with controls
│   │   ├── ChatNavbar.js        # Chat navigation header
│   │   ├── ToolCall.js          # Tool execution display
│   │   └── PingingDot.js        # Status indicator
│   ├── visualization/    # Graph visualization system
│   │   └── graph/        # Core graph components
│   │       ├── InlineGraphVisualization.js  # Main graph container
│   │       ├── GraphCanvas.js               # SVG rendering engine
│   │       ├── NodeRenderer.js              # Node rendering logic
│   │       ├── EdgeRenderer.js              # Edge rendering logic
│   │       ├── GraphHeader.js               # Graph header component
│   │       ├── GraphControls.js             # Pan/zoom controls
│   │       ├── NodeDetailsPanel.js          # Node information panel
│   │       ├── workflowTransformer.js       # Data transformation
│   │       ├── nodePositioning.js           # Layout algorithms
│   │       ├── executionTracker.js          # Execution state tracking
│   │       ├── dataValidation.js            # Input validation
│   │       ├── edgeCasesHandler.js          # Edge case management
│   │       ├── networkErrorHandler.js       # Network error handling
│   │       ├── performanceMonitor.js        # Performance tracking
│   │       ├── types.js                     # Type definitions
│   │       └── index.js                     # Component exports
│   ├── charts/           # Financial chart components
│   │   └── Chart.js             # Interactive chart display
│   ├── modeling/         # Financial modeling components
│   │   ├── PlotlyChart.js       # Advanced chart visualization
│   │   └── Slider.js            # Parameter adjustment controls
│   ├── news/             # News display components
│   │   └── NewsList.js          # News article listing
│   ├── profile/          # Company profile components
│   │   └── CompanyProfile.js    # Company information display
│   ├── tables/           # Data table components
│   │   └── DataFrameTable.js    # Pandas DataFrame display
│   ├── backgrounds/      # Background effect components
│   │   ├── AuroraBackground.js  # Aurora effect
│   │   ├── PrismBackground.js   # Prism light effect
│   │   └── ThreadsBackground.js # Thread animation
│   ├── Flag.js           # Language flag component
│   ├── GitHubButton.js   # GitHub repository link
│   ├── InteractivePill.js # Interactive UI elements
│   ├── LanguageToggle.js # Language switcher
│   ├── Pill.js           # Basic pill component
│   └── Spinner.js        # Loading indicator
├── contexts/             # React contexts
│   ├── LanguageContext.js # Language state management
│   └── SearchContext.js  # Search functionality
├── translations/         # Internationalization
│   └── index.js          # French/English translations
├── utils/               # Utility functions
│   ├── messageDataProcessor.js # Chat message processing
│   └── searchConfig.js         # Search configuration
├── test/                # Test suite
│   ├── components/      # Component tests
│   │   └── visualization/graph/ # Graph component tests
│   ├── integration/     # Integration tests
│   ├── visual/          # Visual regression tests
│   └── setup.js         # Test configuration
├── public/              # Static assets
│   ├── avatar.png       # Stella avatar
│   └── avatar_stella.png # Alternative avatar
└── config files         # Next.js, Tailwind, ESLint, Vitest configs
```

## 🎨 Key Components

### Main Page (`app/page.js`)
- Hero section with animated background
- Typewriter effect for role descriptions
- Modal-based navigation system
- Responsive layout with glassmorphic cards

### Content Components
- **MeContent**: Personal information, values, and background
- **ProjectsContent**: Project showcase with GitHub links
- **SkillsContent**: Technical skills organized by category
- **ContactContent**: Contact information with copy-to-clipboard

### Interactive Elements
- **VantaBackground**: 3D bird simulation background with real-time interaction
- **Typewriter**: Animated text with realistic typing effect and cursor
- **DetailCard**: Modal cards with smooth transitions and glassmorphic design
- **Navbar**: Floating navigation with hover effects and spring animations
- **InteractivePill**: Smart searchable pills with Google/ChatGPT integration (skills, projects, activities, destinations)
- **LanguageToggle**: Smooth language switching with state persistence
- **Image Carousel**: Vertical photo carousel in Beyond Code section
- **Copy-to-Clipboard**: Interactive contact information copying

## 🎯 Portfolio Sections

1. **Me** - Personal background, core values, professional journey with searchable profile information and language skills
2. **Projects** - Featured projects including Stella (AI financial assistant), Zenyth (YouTube summarizer), and this portfolio with searchable technology badges
3. **Skills** - Technical expertise organized by categories with searchable technology pills:
   - Data Science & Analytics (Pandas, Numpy, Scikit-learn, etc.)
   - Agentic AI & Automation (LangChain, LangGraph, RAG, etc.)
   - Backend & Systems (Python, Docker, FastAPI, etc.)
   - Frontend & Prototyping (React, Next.js, Tailwind CSS, etc.)
   - Currently Learning (AWS Cloud, PyTorch, Vector Databases, etc.)
4. **Beyond Code** - Personal interests, hobbies, travel wishlist with searchable activity and destination pills
5. **Contact** - Multiple contact methods with copy-to-clipboard functionality and social links

## 🚀 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎨 Customization

### Updating Content
- Edit content components in `components/content/`
- Update project data in `ProjectsContent.js`
- Modify skills in `SkillsContent.js`
- Change contact info in `ContactContent.js`
- Update translations in `translations/index.js`
- Configure search terms in `utils/searchConfig.js`

### Styling
- Customize colors in Tailwind config
- Modify glassmorphic effects in component classes (`bg-white/20 backdrop-blur-xs`)
- Update animations in Motion variants and transitions
- Adjust DaisyUI component themes and styles

### Background Effects
- Adjust Vanta.js parameters in `app/page.js`
- Change effect type (BIRDS, WAVES, etc.)
- Customize colors and animation speed

### Search & Internationalization
- Add new searchable terms in `utils/searchConfig.js`
- Configure search engines and behavior in `contexts/SearchContext.js`
- Update translations in `translations/index.js`
- Modify language detection logic in `contexts/LanguageContext.js`

## 🔍 Search & Internationalization Features

### Intelligent Search System
- **Interactive Pills**: Click any skill, project technology, activity, or destination to search
- **Smart Context**: Automatically generates relevant search terms based on content type and section
- **Multi-Engine Support**: Choose between Google and ChatGPT for different search experiences
- **Persistent Preferences**: Remembers your preferred search engine
- **Mobile Optimized**: Touch-friendly interactions with responsive design

### Multilingual Support
- **Complete Translation**: Every text element available in French and English
- **Automatic Detection**: Browser language detection with manual override
- **Context-Aware**: Search terms and results adapt to selected language
- **Smooth Transitions**: Language switching without page reload
- **Persistent State**: Language preference saved across sessions

## 🤖 AI Integration

This project includes Kiro AI assistant integration for enhanced development workflow:
- **Steering Documents**: AI guidance for technology stack, project structure, and product vision
- **Automated Workflows**: Hooks for documentation updates and code quality
- **Specifications**: Detailed feature specs for complex implementations
- **Code Analysis**: AI-powered code review and optimization suggestions
- **Documentation Sync**: Automatic updates to README and steering files based on project changes

## 📱 Responsive Design

- Mobile-first approach with Tailwind breakpoints
- Optimized touch interactions for mobile devices
- Adaptive layouts for tablets and desktops
- Performance optimized with Next.js Image component

## 🔧 Development Notes

- **Next.js App Router**: Modern routing with server and client components
- **Client Components**: Interactive components marked with `"use client"` directive
- **Dynamic Imports**: Heavy libraries (Vanta.js) loaded with `ssr: false` for performance
- **Font Optimization**: Geist fonts loaded via Next.js font system
- **Animation Consistency**: Standardized hover transitions (`duration: 0.2, ease: "easeOut"`)
- **Code Quality**: ESLint 9 configuration with Next.js rules
- **Asset Organization**: Strategic placement of images and SVGs for optimal loading
- **Context Architecture**: React contexts for language and search state management
- **Search Intelligence**: Dynamic search term generation based on content analysis
- **Performance Optimized**: Lightweight implementation without testing overhead

## 📄 License

This project is private and proprietary.

## 📚 Usage Examples

### Basic Graph Visualization Integration

```jsx
import { InlineGraphVisualization } from '@/components/visualization/graph';

function ChatMessage({ message }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="message">
      <div className="message-content">{message.text}</div>
      
      {message.toolCalls && (
        <InlineGraphVisualization
          toolCalls={message.toolCalls}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          language="en"
        />
      )}
    </div>
  );
}
```

### Custom Node Positioning

```jsx
import { calculateNodePositions, getGroupBoundaries } from '@/components/visualization/graph';

function CustomWorkflowLayout({ nodes, screenWidth, screenHeight }) {
  const positionedNodes = calculateNodePositions(nodes, screenWidth, screenHeight);
  const groupBoundaries = getGroupBoundaries(positionedNodes);
  
  return (
    <div className="workflow-layout">
      {groupBoundaries.map(group => (
        <div key={group.id} className="tool-group">
          <h3>{group.label.en}</h3>
          <div style={{ 
            left: group.bounds.minX, 
            top: group.bounds.minY,
            width: group.bounds.maxX - group.bounds.minX,
            height: group.bounds.maxY - group.bounds.minY
          }}>
            {/* Group visualization */}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Workflow Data Transformation

```jsx
import { transformWorkflowData } from '@/components/visualization/graph';

async function processAgentResponse(toolCalls) {
  // Transform backend data for visualization
  const graphData = transformWorkflowData(toolCalls, -1, 'en');
  
  // Access transformed components
  const { nodes, edges, nodeStates, metadata } = graphData;
  
  console.log(`Processed ${nodes.length} nodes and ${edges.length} edges`);
  console.log(`Active nodes: ${nodeStates.activeNodes.size}`);
  
  // Handle edge cases
  if (metadata.hasEdgeCases) {
    console.log('Edge cases detected:', metadata.edgeCaseTypes);
  }
  
  return graphData;
}
```

### Performance Monitoring

```jsx
import { usePerformanceMonitor } from '@/components/visualization/graph/performanceMonitor';

function OptimizedGraphComponent({ toolCalls }) {
  const { monitor } = usePerformanceMonitor('GraphComponent', {
    toolCallsCount: toolCalls.length
  });
  
  useEffect(() => {
    const result = monitor.measureAsync('data-processing', async () => {
      return await processLargeWorkflow(toolCalls);
    });
    
    // Monitor memory usage
    monitor.monitorMemory('after-processing');
  }, [toolCalls]);
  
  return <GraphVisualization data={processedData} />;
}
```

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_GRAPH_VIRTUALIZATION=true
NEXT_PUBLIC_MAX_VISIBLE_NODES=200
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Visualization Settings
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_GRAPH_CACHE_SIZE=50
```

### Customization Options

#### Graph Styling
```css
/* Custom node colors */
:root {
  --node-start-color: #10b981;
  --node-agent-color: #8b5cf6;
  --node-tool-color: #3b82f6;
  --node-preparation-color: #f59e0b;
  --node-error-color: #ef4444;
}

/* Glassmorphism effects */
.graph-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Performance Tuning
```javascript
// Adjust virtualization thresholds
const PERFORMANCE_CONFIG = {
  virtualizationThreshold: 50,
  chunkSize: 25,
  maxCacheSize: 100,
  debounceDelay: 16, // ~60fps
  throttleLimit: 16
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:components
npm run test:integration
npm run test:visual

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction and data flow
- **Visual Regression Tests**: Screenshot comparison for UI consistency
- **Performance Tests**: Rendering speed and memory usage
- **Accessibility Tests**: Keyboard navigation and screen reader support

## 🤝 Contributing

This project is part of the Stella AI financial analysis platform. For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add comprehensive JSDoc comments for new functions
- Include tests for new components and features
- Update documentation for API changes
- Ensure accessibility compliance (WCAG 2.1 AA)
- Test on multiple screen sizes and devices
