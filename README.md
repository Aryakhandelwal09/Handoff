# Handoff

An onboarding assistant that turns a public GitHub repo into a visual, node-graph
reading path — built to help a new teammate get up to speed on an existing
codebase (final-year project handoff, hackathon repo pickup, joining a team).

## Structure

- `backend/` — Node.js + Express API. Fetches repo data from GitHub, analyzes it
  with Claude, returns structured onboarding data (summary, file nodes, checklist).
- `frontend/` — React app (Vite). Landing, loading, results (node-graph canvas +
  side panel), and inline error states.

## Running it locally

**Backend**
```
cd backend
cp .env.example .env      # then fill in your real ANTHROPIC_API_KEY and GITHUB_TOKEN
npm install
node server.js            # runs on http://localhost:3001
```

**Frontend**
```
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # runs on http://localhost:5173 (or similar)
```

## Notes

- v1 supports public repos only. Private-repo support (via a pasted personal
  access token) is planned future scope, not built yet.
- No login system — checklist progress is stored in the browser's localStorage,
  keyed per repo.
- The backend uses its own GitHub token purely to raise the API rate limit for
  public repos (5,000/hr instead of 60/hr) — not for accessing private data.
- Node.js `fetch` requires Node 18+.
