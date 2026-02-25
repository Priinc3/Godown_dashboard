# AI Context for Joyspoon Dashboard

## Project Overview
- **Purpose**: A web dashboard for managing productivity (work entries), expenses, sales analysis, and finance (invoices). Originally named Godown Dashboard, rebranded to Joyspoon.
- **Tech Stack**: 
  - Frontend: Vanilla HTML/CSS/JS (No frameworks)
  - Backend: Node.js (Express), `multer`, `@aws-sdk/client-s3`
  - Database & Auth: Supabase (PostgreSQL, Supabase Auth)
  - Charts: Chart.js
- **Architecture**: Monolithic repository. Frontend served statically from `public/` directory by the Express backend.

## Current State
- **Version**: 0.3.0
- **Status**: In Development (Added Auth, Finance, and AWS handling)
- **Last Updated**: 2026-02-21

## File Structure
```
.
├── server.js               # Express API and static file server
├── package.json            # Node dependencies
├── supabase-schema.sql     # Initial DB schema and seed data
└── public/
    ├── index.html          # Main SPA container and sidebar layout
    ├── index.css           # Global stylesheets
    ├── app.js              # Frontend logic and DOM manipulation routing
    └── login.html          # Auth entrypoint
```

## Key Components
### `server.js`
- **Location**: `/server.js`
- **Purpose**: Exposes REST endpoints for CRUD operations and handles AWS S3 uploads and n8n webhooks.
- **Dependencies**: `express`, `cors`, `@supabase/supabase-js`, `dotenv`, `multer`, `@aws-sdk/client-s3`.

### `app.js`
- **Location**: `/public/app.js`
- **Purpose**: Manages frontend state, UI rendering (dynamic views via `getPageContent()`), routing logic, and Supabase session management.

## Configuration
- **Environment Variables**:
  - `SUPABASE_URL`: Supabase project URL
  - `SUPABASE_ANON_KEY`: Supabase anon/public key for the backend
  - `PORT`: Express server port
- **API Endpoints**:
  - `/api/employees`, `/api/work-entries`, `/api/expenses`, `/api/settings`
  - `/api/data-sources` (Google Sheets imports)
  - `/api/invoices/upload` (S3 upload + DB insert + webhook trigger)
- **Database Schema**: 
  - Tables: `employees`, `work_types`, `products`, `units`, `work_entries`, `expense_categories`, `expenses`, `settings`, `data_sources`, `profiles`, `invoices`.

## Known Issues
- Currently relying on basic frontend route protection and Supabase RLS. More tight backend JWT verification may be needed.

## Future Improvements
- Add robust Row Level Security (RLS) in Supabase.
- User-based application and module access filtering natively on the server-side.
- Finance invoice integration with n8n and Google Sheets.

## Development Notes
- The user enforces a **clean, white/light theme** with specific typography (Inter). NO gradients.
- Always implement smooth DOM transitions for new UI elements.
- The project follows a strict Vanilla JS structure (no React). Ensure DOM updates use efficient literal rendering or safe DOM methods.
