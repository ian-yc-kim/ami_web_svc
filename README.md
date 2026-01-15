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

### Kanban / Drag-and-drop

- @dnd-kit/core
  - Used to implement drag-and-drop interactions in the Kanban Board (src/components/KanbanBoard.tsx)

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
- /meetings  → MeetingListPage (protected)
- /meetings/new  → MeetingCreatePage (protected)
- /meetings/:id  → MeetingDetailPage (protected)
- /meetings/:id/edit  → MeetingEditPage (protected)

The Navbar renders a Logout button when authenticated and will navigate to /login after logout.

## Action Items Management

This project includes a feature to manage Action Items (tasks) that are associated with meetings. The following summarizes the high-level workflow, user interactions, and key files for maintainers.

High-level workflow

- Where action items appear
  - Action items are shown on the Meeting Detail page for a given meeting.
  - The Meeting Detail page fetches and renders action items in a list beneath meeting notes.

- Generating and reviewing action items
  - A meeting can be analyzed (AI-powered analysis) via the "Review Action Items" button on the Meeting Detail page.
  - Analysis results surface suggested action items in a review modal where maintainers or users can edit, add, or remove items before saving.

- Persisting and updating status
  - Action items are created in bulk when the review modal is saved.
  - Each action item has a status (To Do / In Progress / Done) and can be updated from the Action Item list. Status updates are persisted via the API.

User interactions summary

- Review Action Items: Click the "Review Action Items" button on a meeting to analyze notes and open the review modal with suggested items.
- Edit items in the modal: modify description, assignee, and due date. Save to persist all items for the meeting.
- Update status inline: use the status selector on each action item to change status; the change is persisted and the list refreshed.

Files of interest (for maintainers)

- src/pages/MeetingDetailPage.tsx
  - Orchestrates meeting load, analysis request, fetch of action items, and wiring between modal and list.

- src/components/ActionItemReviewModal.tsx
  - Modal UI for reviewing and editing suggested action items before saving them for a meeting.

- src/components/ActionItemList.tsx
  - Renders action items, formats due dates, marks overdue items, and provides a status selector for updates.

- src/components/KanbanBoard.tsx
  - Implements the Kanban Board UI and drag-and-drop interactions using @dnd-kit/core.

- src/api/actionItems.ts
  - API helpers for fetching and updating action items.

- src/api/meetings.ts
  - Contains createActionItems and analyzeMeeting helpers which interact with action item creation and analysis endpoints.

- src/types/actionItem.ts contains DTOs and ActionItem type definitions (CreateActionItemDTO, UpdateActionItemDTO, ActionItem, ActionItemStatus).

### Kanban Board (Action Items)

Overview

The Meeting Detail page supports a Kanban Board view for action items in addition to the traditional list view. The board helps visualize and update task statuses via drag-and-drop interactions.

Features

- Columns
  - The board contains three columns representing status values: "To Do", "In Progress", and "Done".

- Drag-and-drop status updates
  - Drag a card between columns to update its status.
  - Status changes are persisted via the action item update API (see src/api/actionItems.ts).
  - The board uses @dnd-kit/core to manage drag-and-drop interactions (see src/components/KanbanBoard.tsx).

- Overdue highlighting
  - Action items with a due date in the past and a status that is not "Done" are visually highlighted on both list and board views.

Usage (user-facing)

- Navigate to the board
  - From the app: Meetings → select a Meeting → Action Items section in Meeting Detail.

- View Toggle (List vs Board)
  - Use the View Toggle buttons in the Action Items header to switch between List and Board views.
  - List view shows a tabular/list representation; Board view shows columns and drag-and-drop cards.

- Filters
  - Assignee filter: select an assignee from the dropdown to limit items to that person. Default "All" shows all assignees.
  - Priority filter: choose from All, Low, Medium, High to filter items by priority.
  - Filters apply to both List and Board views.

Notes for maintainers

- The component responsible for the board is src/components/KanbanBoard.tsx. It groups action items by status and uses the updateItem callback to persist status changes.
- Keep the status string values consistent with the backend: "To Do", "In Progress", "Done".
- The board relies on @dnd-kit/core; ensure the package is listed in package.json (it is already included).

## Testing

- Unit tests are implemented with Vitest. Run them with:

  npm run test:run

- Tests mock API calls and verify:
  - Authentication behavior including login, logout, route protection, and navigation
  - Action item list behavior, modal save flow, and status updates
  - KanbanBoard drag-and-drop behavior and overdue highlighting (see src/components/KanbanBoard.test.tsx)

## Documentation checklist (for reviewers)

- VITE_API_BASE_URL definition and example present
- Routes list included (/login and /)
- Authentication flow summary present (login, persistence, logout, 401 handling)
- Action Items Management section present and accurate
- Kanban Board section documents columns, drag-and-drop, overdue highlighting, view toggle, and filters
- @dnd-kit/core listed as a Kanban dependency

## Troubleshooting

- If API requests fail, verify VITE_API_BASE_URL is correct and backend accepts CORS and credentials.
- If the app redirects unexpectedly to /login, clear localStorage and re-login.

## Contributing

- Follow existing code structure under src/ (components, pages, contexts, api, types)
- Keep components small (<200 lines)
- Use explicit TypeScript types; avoid any

---

If you need more detailed backend endpoint documentation (payload schemas, status codes), add a separate API docs file or update the backend README.
