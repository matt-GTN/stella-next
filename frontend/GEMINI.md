# GEMINI Project: Modern Portfolio Website

## Project Overview

This project is a personal portfolio website built with Next.js 15 and React 19. It showcases a modern, interactive, and multilingual web application. The frontend is styled with Tailwind CSS 4 and DaisyUI, featuring a glassmorphic design and smooth animations powered by Framer Motion. A key feature is the interactive 3D background using Vanta.js and Three.js. The application also includes an intelligent search functionality and full English/French internationalization.

The project is structured using the Next.js App Router, with a clear separation of components, contexts, and utility functions. It is a single-page application with modal navigation, where content for different sections (Me, Projects, Skills, etc.) is loaded into detail cards.

## Project Structure
```
/Users/mathis/Documents/projects/portfolio/
├───.dockerignore
├───.gitignore
├───Dockerfile
├───eslint.config.mjs
├───GEMINI.md
├───jsconfig.json
├───next.config.mjs
├───package-lock.json
├───package.json
├───postcss.config.mjs
├───README.md
├───.git/...
├───.kiro/...
├───.next/
│   ├───cache/...
│   ├───server/...
│   ├───static/...
│   └───types/...
├───.vscode/...
├───app/
│   ├───favicon.ico
│   ├───globals.css
│   ├───layout.js
│   └───page.js
├───components/
│   ├───CallToActionButton.js
│   ├───DetailCard.js
│   ├───GitHubButton.js
│   ├───InteractivePill.js
│   ├───LanguageToggle.js
│   ├───Navbar.js
│   ├───NavbarItem.js
│   ├───Pill.js
│   ├───Section.js
│   ├───Typewriter.js
│   ├───content/
│   │   ├───BeyondCodeContent.js
│   │   ├───ContactContent.js
│   │   ├───MeContent.js
│   │   ├───ProjectsContent.js
│   │   └───SkillsContent.js
│   ├───svg/
│   │   ├───Birds.js
│   │   └───Zenyth.js
│   └───vanta/
│       ├───_VantaClient.js
│       └───VantaBackground.js
├───contexts/
│   ├───LanguageContext.js
│   └───SearchContext.js
├───data/
│   ├───me.js
│   ├───projects.js
│   └───skills.js
├───hooks/
│   └───usePerformanceMonitor.js
├───node_modules/...
├───public/
│   ├───avatar_stella.png
│   ├───avatar.png
│   ├───sevilla_1.jpg
│   ├───sevilla_2.jpg
│   └───sevilla_3.jpg
├───translations/
│   └───index.js
└───utils/
    ├───helpers.js
    └───searchConfig.js
```

## Building and Running

### Prerequisites

*   Node.js 18+
*   npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd portfolio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Project

*   **Development:**
    ```bash
    npm run dev
    ```
    This will start the development server on [http://localhost:3000](http://localhost:3000).

*   **Production Build:**
    ```bash
    npm run build
    ```

*   **Start Production Server:**
    ```bash
    npm run start
    ```

### Testing

There are no explicit test scripts defined in `package.json`. However, the project uses ESLint for linting.

*   **Linting:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Framework:** The project uses Next.js with the App Router.
*   **Styling:** Tailwind CSS is used for styling, with DaisyUI for UI components. A glassmorphic design is a key aesthetic.
*   **Components:** React components are organized in the `components` directory, with subdirectories for content, SVG icons, and Vanta.js backgrounds.
*   **State Management:** React contexts are used for managing global state, such as language and search preferences.
*   **Internationalization:** A custom translation system is implemented in the `translations` directory.
*   **Animations:** The `motion` library (Framer Motion successor) is used for animations.
*   **Code Quality:** ESLint is configured for code linting.