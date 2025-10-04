# AI Copilot React Frontend

This is the frontend web interface for the AI Copilot. It is a lightweight React app with a clean, classic UI styled using the Heritage Brown theme. The frontend consumes a FastAPI backend via REST endpoints.

## Overview

The frontend runs on port 3000 by default, and it communicates with the backend which runs on port 3001. The UI includes a header, a collapsible sidebar, and a central chat workspace. A health banner at the top of the chat surface displays the backend status as either “ok” or “unavailable” based on /api/health.

Key runtime behavior:
- Health banner: Shows “ok” when the backend health endpoint returns status ok; otherwise shows “unavailable”.
- Chat API contract: The chat endpoint expects a request body { messages: [{ role, content }], prompt: string } and returns { message: { role, content } }.
- Suggestions: On initial load, optional suggestions are fetched from /api/suggest and displayed when there are no messages yet.

## Getting Started

In the project directory, you can run:

- npm start
  Runs the app in development mode.
  Open http://localhost:3000 to view it in your browser.

- npm test
  Launches the test runner in interactive watch mode.

- npm run build
  Builds the app for production to the build folder. It bundles React in production mode and optimizes the build for best performance.

Note on preview: In the hosted preview environment, services are orchestrated by the platform. Do not include commands to start preview services manually; simply use the provided preview URLs.

## Configuration

The frontend determines which backend to call using a clear resolution order. The logic resides in src/config.js and is used by the API client in src/api/client.js.

API base resolution order:
1) window.__API_BASE__ if defined at runtime in the hosting page. This provides a runtime override without rebuilding.
2) process.env.REACT_APP_API_BASE if provided at build time. This can be set via an .env file or environment variables during build.
3) Same-origin fallback: If the app is served behind a reverse proxy that maps /api to the backend on the same host, the app uses window.location.origin.
4) http://localhost:3001 as the final fallback for local development.

Resulting behavior:
- Local development with two ports (frontend: 3000, backend: 3001): Either set REACT_APP_API_BASE=http://localhost:3001 in an .env file or rely on the hardcoded fallback if no other setting is present.
- Same-origin deployment behind a proxy: Omit window.__API_BASE__ and REACT_APP_API_BASE; the app will call the backend at the same origin (e.g., https://yourdomain) under /api.
- Dynamic runtime override: If you inject window.__API_BASE__ into the hosting page, that value takes precedence.

Ports used:
- Frontend: 3000
- Backend: 3001

## Environment Variables

You can optionally create a .env file at the project root of this frontend to pin the backend base URL for local development convenience.

Example .env:
REACT_APP_API_BASE=http://localhost:3001

With this set, the app will use http://localhost:3001 as the API base even if window.__API_BASE__ is not provided.

Note: Only variables prefixed with REACT_APP_ are exposed to the frontend code.

## Development Notes

- Health display: The health check is performed against GET /api/health. The frontend normalizes any 200 response into "ok" (any non-2xx -> "unavailable") for display in the banner. The target URL resolves to `${getApiBase()}/api/health` which is http://localhost:3001/api/health for local development unless overridden. See src/api/client.js:getHealth and src/components/ChatWindow.js for the UI handling.
- Chat flow: Sending a message triggers a POST to /api/chat with payload { messages: [{ role, content }], prompt: string }. The frontend expects a response { message: { role, content } } and displays it as the assistant’s reply. See src/api/client.js:postChat and src/hooks/useChat.js.
- Suggestions: Optional initial suggestions are loaded from GET /api/suggest and displayed when there are no messages yet. See src/api/client.js:getSuggestions and src/components/ChatWindow.js.

## Troubleshooting

- I see “Service status: unavailable”:
  This indicates the health check failed. Confirm your backend is running on port 3001 and reachable from the browser. If developing locally on split ports, ensure REACT_APP_API_BASE is set to http://localhost:3001 in an .env file or that your environment injects window.__API_BASE__.

- CORS or mixed-content errors:
  If the frontend and backend are on different origins, configure CORS on the backend or use a local reverse proxy so that the app can use same-origin calls (resolution step #3). In preview, rely on the platform configuration rather than manual changes.

- The app calls the wrong API host:
  Double-check the resolution order. If window.__API_BASE__ is present, it wins. If not, verify your .env sets REACT_APP_API_BASE and that you restarted the dev server after changes. Otherwise, ensure your deployment expects same-origin and that /api is routed correctly, or rely on the fallback http://localhost:3001 during local development.

- How to start the preview:
  The preview system is managed by the platform. You should not manually start services in preview mode. Use the provided preview URLs for the frontend (port 3000) and backend (port 3001).
