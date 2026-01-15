# ami_web_svc (meeting-web)

Frontend React + TypeScript application for meeting management, AI summaries, kanban action items, and team dashboards.

## Prerequisites

- Node.js (recommended >= 18)
- npm (recommended >= 8)
- A running backend API (see Environment Configuration)

## Installation

1. Install dependencies

   npm install

2. Run development server

   npm run dev

3. Useful scripts

- npm run dev         # start dev server (Vite)
- npm run build       # build production assets
- npm run lint        # run linter
- npm run test:run    # run unit tests (Vitest)
- npm run preview     # preview built app

## Key Dependencies (Authentication-related)

- axios
  - HTTP client used in src/api/client.ts
  - Configured with baseURL and an interceptor that redirects to /login on 401

- react-router-dom
  - Routing and route protection (Routes, Navigate, Outlet)
  - ProtectedRoute is implemented in src/components/ProtectedRoute.tsx

These packages are declared in package.json and used by the auth flow implementation.

## Environment Configuration

The frontend expects the backend base URL and optional base path to be configured via Vite env vars.

Important variables

- VITE_API_BASE_URL
  - The base URL for API requests (used by src/api/client.ts)
  - Example: http://localhost:8000

- VITE_BASE_PATH
  - Optional base path for deployments hosted under a sub-path (used by Vite `base` and BrowserRouter `basename`)
  - Example: /ami_web_svc/

Example .env (create from .env.example):

VITE_API_BASE_URL=http://localhost:8000
VITE_BASE_PATH=/

Notes:
- Copy .env.example to .env and set VITE_API_BASE_URL for local development.
- import.meta.env.VITE_API_BASE_URL will be read at build time by the app.

## Authentication Flow (high level)

Files of interest:
- src/contexts/AuthContext.tsx      (login/logout, persistence)
- src/api/client.ts                (axios client and 401 interceptor)
- src/components/ProtectedRoute.tsx (route protection)
- src/pages/LoginPage.tsx          (login form and redirect)
- src/components/Navbar.tsx        (shows Logout when authenticated)

Flow:
1. User submits credentials on /login. LoginPage calls AuthContext.login().
2. AuthContext.login() posts credentials to POST /auth/login using the axios client.
3. On success, the response user payload is stored in memory and persisted to localStorage under the key `auth_user`.
4. ProtectedRoute uses useAuth() to determine access. If not authenticated it redirects to /login (preserving prior location in state).
5. Logout calls POST /auth/logout and clears localStorage and context state.
6. The axios client in src/api/client.ts intercepts responses; if a 401 is encountered it redirects the browser to the login path respecting VITE_BASE_PATH.

Storage key: auth_user

Error handling:
- API and auth code log errors to help debugging (see console.error locations in the codebase).

## Routes

- /login  → LoginPage (public)
- /       → DashboardPage (protected; reachable only when authenticated)

The Navbar renders a Logout button when authenticated and will navigate to /login after logout.

## Testing

- Unit tests are implemented with Vitest. Run them with:

  npm run test:run

- Tests mock API calls and verify auth behavior, ProtectedRoute behavior, and navigation.

## Documentation checklist (for reviewers)

- VITE_API_BASE_URL definition and example present
- Routes list included (/login and /)
- Authentication flow summary present (login, persistence, logout, 401 handling)

## Troubleshooting

- If API requests fail, verify VITE_API_BASE_URL is correct and backend accepts CORS and credentials.
- If the app redirects unexpectedly to /login, clear localStorage and re-login.

## Contributing

- Follow existing code structure under src/ (components, pages, contexts, api, types)
- Keep components small (<200 lines)
- Use explicit TypeScript types; avoid any

---

If you need more detailed backend endpoint documentation (payload schemas, status codes), add a separate API docs file or update the backend README.
