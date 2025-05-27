# Codebase Structure

This document outlines the directory and file structure of the Song Alchemy Creator project.

```
├── .env - Environment variables for the project.
├── .gitignore - Specifies intentionally untracked files that Git should ignore.
├── .windsurf
│   ├── rules
│   │   ├── guidelines.md - Coding guidelines for the project.
│   │   ├── system-prompts.md - System prompts for AI interaction.
│   │   └── ui-components.md - Rules and information about UI components.
│   └── workflows
│       └── open-preview.md - Workflow definition for opening a preview.
├── README.md - General information about the project.
├── bun.lockb - Lockfile for Bun package manager, ensuring reproducible installs.
├── components.json - Configuration for UI components, likely for shadcn/ui.
├── eslint.config.js - Configuration for ESLint, a code linter.
├── index.html - Main HTML entry point for the web application.
├── node_modules  (directory - contents omitted for brevity)
├── package-lock.json - Records the exact versions of dependencies for npm.
├── package.json - Project metadata, dependencies, and scripts.
├── postcss.config.js - Configuration for PostCSS, a CSS preprocessor.
├── public
│   ├── favicon.ico - Favicon for the website.
│   ├── placeholder.svg - Placeholder SVG image.
│   └── robots.txt - Instructions for web crawlers.
├── src
│   ├── App.css - Main CSS styles for the App component.
│   ├── App.tsx - Main application component.
│   ├── components
│   │   ├── FeatureSection.tsx - Component for displaying a feature section.
│   │   ├── Footer.tsx - Footer component for the application.
│   │   ├── Header.tsx - Header component for the application.
│   │   ├── Hero.tsx - Hero section component.
│   │   ├── LoginButton.tsx - Component for user login functionality.
│   │   ├── PlaylistGenerator.tsx - Component for generating playlists.
│   │   ├── PlaylistTracks.tsx - Component for displaying tracks in a playlist.
│   │   ├── Sidebar.tsx - Sidebar navigation component.
│   │   └── ui (directory - contents omitted as per request)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── constants (empty) - Placeholder for application-wide constant values.
│   ├── hooks
│   │   ├── use-mobile.tsx - Custom React hook for detecting mobile screen sizes.
│   │   └── use-toast.ts - Custom React hook for managing and displaying toast notifications (integrates with shadcn/ui Toast).
│   ├── index.css - Global CSS styles and Tailwind CSS base/components/utilities.
│   ├── lib
│   │   └── utils.ts - General utility functions used across the application.
│   ├── main.tsx - The main entry point of the React application, responsible for rendering the root component.
│   ├── pages
│   │   ├── Callback.tsx - React component to handle OAuth callback from Spotify, exchanging authorization code for tokens.
│   │   ├── Dashboard.tsx - The main dashboard page displayed after successful login, likely showing user-specific content and playlist tools.
│   │   ├── Index.tsx - The landing/home page of the application, shown to users before login.
│   │   └── NotFound.tsx - React component for displaying a 404 Not Found error page.
│   ├── types (empty) - Directory intended for custom TypeScript type definitions and interfaces.
│   ├── utils
│   │   ├── openai.ts - Utility functions for interacting with the OpenAI API, likely for AI-powered music suggestions or analysis.
│   │   └── spotify.ts - Utility functions for making requests to the Spotify Web API (e.g., fetching user data, playlists, tracks).
│   └── vite-env.d.ts - TypeScript declaration file for Vite-specific environment variables, providing type safety.
├── tailwind.config.ts - Configuration file for Tailwind CSS, defining theme, plugins, and content paths.
├── tsconfig.app.json - TypeScript configuration specific to the application's build process (e.g., includes, compiler options).
├── tsconfig.json - The root TypeScript configuration file for the project, setting global compiler options.
├── tsconfig.node.json - TypeScript configuration for Node.js environments, like Vite configuration files or scripts.
└── vite.config.ts - Configuration file for Vite, the frontend build tool, defining plugins, server options, and build settings.
```
