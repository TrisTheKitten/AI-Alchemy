# Song Alchemy Creator

## Technologies Used

This project is built with a modern web development stack:

- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [React](https://reactjs.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Data Fetching/State Management:** [Tanstack Query (React Query)](https://tanstack.com/query/latest)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Generative AI:** Google Generative AI (`@google/genai`)

## Project Structure

The codebase is organized as follows:

- **`public/`**: Contains static assets that are served directly by the web server (e.g., `index.html` during development, favicons).
- **`src/`**: Contains the main source code for the application.
    - **`main.tsx`**: The entry point of the React application.
    - **`App.tsx`**: The root component of the application, often setting up routing.
    - **`components/`**: Reusable UI components used throughout the application.
        - **`ui/`**: Contains shadcn/ui components.
    - **`pages/`**: Components representing different pages/views of the application.
    - **`hooks/`**: Custom React hooks for reusable logic.
    - **`lib/`**: Utility functions and helper modules (e.g., `cn` for classnames).
    - **`utils/`**: Other utility functions, potentially for specific integrations (e.g., `spotify.ts`).
    - **`constants/`**: Application-wide constants.
    - **`types/`**: TypeScript type definitions.
    - **`index.css` / `App.css`**: Global styles and Tailwind CSS base styles.
- **`index.html`**: The main HTML file that Vite uses as a template.
- **`package.json`**: Lists project dependencies and scripts.
- **`vite.config.ts`**: Vite configuration file.
- **`tailwind.config.ts`**: Tailwind CSS configuration file.
- **`tsconfig.json`**: TypeScript configuration file.
- **`eslint.config.js`**: ESLint configuration for code linting.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Bun](https://bun.sh/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_REPOSITORY_URL>
    cd <YOUR_PROJECT_DIRECTORY_NAME> 
    # e.g., cd song-alchemy-creator-main
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using Bun (if `bun.lockb` is preferred):
    ```bash
    bun install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying `.env.example` (if one exists) or by creating it manually.
    Populate it with necessary API keys or configuration values.
    ```
    # .env
    # Example:
    # VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
    # VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
    ```
    *(Note: The specific variables needed will depend on the project's integrations, like Spotify or Google GenAI.)*

### Running the Development Server

To start the development server with hot reloading:

```bash
npm run dev
```
Or using Bun:
```bash
bun run dev
```
This will typically start the server on `http://localhost:3001`.

## Available Scripts

The `package.json` defines the following scripts:

- **`npm run dev`**: Starts the Vite development server (usually on port 3001).
- **`npm run build`**: Builds the application for production. Output is in the `dist/` directory.
- **`npm run build:dev`**: Builds the application in development mode.
- **`npm run lint`**: Lints the codebase using ESLint.
- **`npm run preview`**: Serves the production build locally to preview it.

(If using Bun, replace `npm run` with `bun run`)

## Building for Production

To create a production-ready build of the application:

```bash
npm run build
```
Or using Bun:
```bash
bun run build
```
The optimized static assets will be placed in the `dist/` directory. This directory can then be deployed to any static site hosting service.

---

*This README provides a general overview. Please update it with more specific details about "Song Alchemy Creator" as the project evolves.*
