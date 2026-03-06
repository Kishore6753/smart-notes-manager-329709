# notes_frontend

Next.js UI for Smart Notes Manager.

## Features

- Notes list + favorites filter
- Search (calls backend `/notes/search`)
- Create/update/delete notes (calls backend `/notes`, `/notes/{id}`)
- Markdown editor with preview / split mode
  - Markdown is stored as plain text in the existing `content` field (backend storage remains compatible)

## Environment

Uses:

- `NEXT_PUBLIC_API_BASE` (preferred) or `NEXT_PUBLIC_BACKEND_URL` to reach the FastAPI backend.

Run locally:

```bash
npm install
npm run dev
```
