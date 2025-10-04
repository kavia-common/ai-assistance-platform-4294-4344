# AI Copilot React Frontend (Reset Minimal Scaffold)

This frontend has been reset to a minimal React app that:
- Displays a health status banner by calling GET /api/health.
- Provides a simple chat input that POSTs to /api/chat (stub-friendly; handles missing backend gracefully).
- Resolves the backend API base using src/config.js with the following priority:
  1) window.__API_BASE__ (runtime)
  2) REACT_APP_API_BASE (build-time)
  3) If running on http://localhost:3000, default to http://localhost:3001
  4) Same-origin fallback

## Run

- npm start
- npm run build
- npm test

Open http://localhost:3000 in your browser when running locally.

## Files of interest

- src/config.js: getApiBase() logic.
- src/api/client.js: getHealth() and postChat() helpers.
- src/App.js: Minimal UI with health banner and chat input.

## Configuration

Optional .env at project root:
REACT_APP_API_BASE=http://localhost:3001
# Or another backend:
# REACT_APP_API_BASE=http://localhost:8000

Note: Only variables prefixed with REACT_APP_ are exposed in React.

## Behavior

- Health: Any HTTP 200 from /api/health is treated as "ok"; otherwise "unavailable".
- Chat: Sends { messages, prompt } to POST /api/chat. If the backend is not implemented, the UI shows an error and a friendly assistant message indicating unavailability.

## Troubleshooting

- If the banner shows "unavailable", verify the backend is running and the API base URL is correct.
- For split-port local dev, leave defaults (frontend 3000, backend 3001) or set REACT_APP_API_BASE accordingly.
- CORS errors indicate cross-origin issues; configure backend CORS or use same-origin deployment.
