# Northstar Learning — EdTech CRM & Inquiry System

A full-stack inquiry intake and admin CRM built for the assessment. The public form accepts Parent, Student, or School inquiries across Scholarship, Concert, Admission, and General Query topics. The protected dashboard supports search, filters, message review, and status changes.

## Stack

- **Web:** Next.js, React, TypeScript, responsive CSS
- **API:** Express, TypeScript, Zod validation
- **Database:** Supabase PostgreSQL through `pg`
- **Admin authentication:** bcrypt password hashes and custom JWT in an HTTP-only cookie; Supabase Auth is not used

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project with its PostgreSQL connection string

## Run locally

1. From this folder install dependencies:

   ```sh
   npm install
   ```

2. In Supabase, open **SQL Editor**, paste the contents of `database/schema.sql`, and run it.

3. Copy `.env.example` to `apps/api/.env` and set `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, and `NODE_ENV=development`. Use the Supabase **Session pooler** connection string if your network cannot connect directly. Keep the `sslmode=require` setting. Generate a long random JWT secret, for example with `openssl rand -base64 48`. Never commit `.env` files.

4. Copy `.env.example` to `apps/web/.env.local`. Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api` for local development.

5. Create an admin account. This prompts for an email and password (12+ characters), hashes the password with bcrypt, and inserts it into `admins`:

   ```sh
   npm run admin:create
   ```

6. Start both applications:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the inquiry form or [http://localhost:3000/admin](http://localhost:3000/admin) for the admin workspace. The API health check is at [http://localhost:4000/api/health](http://localhost:4000/api/health).

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `DATABASE_URL` | API | Supabase PostgreSQL connection string; keep credentials private |
| `JWT_SECRET` | API | Random secret of at least 32 characters |
| `API_PORT` | API | API listener port; defaults to `4000` |
| `WEB_ORIGIN` | API | Exact public web origin allowed by credentialed CORS |
| `NODE_ENV` | API | Set to `production` when deployed |
| `NEXT_PUBLIC_API_URL` | Web | API base URL including `/api` |

The JWT expires after eight hours. In production the authentication cookie uses `Secure`, `HttpOnly`, and `SameSite=None` so a separately hosted frontend and API can share it over HTTPS. Set `WEB_ORIGIN` to the exact deployed frontend origin; do not use `*`.

## Build

```sh
npm test
npm run build
```

The automated tests cover inquiry field validation and login input validation. The build compiles the API and creates an optimized Next.js production build.

## API overview

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/inquiries` | Public | Validate and save an inquiry |
| `POST` | `/api/admin/login` | Public, rate limited | Check bcrypt hash and set JWT cookie |
| `POST` | `/api/admin/logout` | Public | Clear the admin cookie |
| `GET` | `/api/admin/me` | Admin | Check the current session |
| `GET` | `/api/admin/inquiries` | Admin | Search and filter inquiries (up to 300 results) |
| `PATCH` | `/api/admin/inquiries/:id/status` | Admin | Update an inquiry status |

All database values are parameterized. Public submissions and login attempts have rate limits. Admin routes verify the JWT in middleware. The SQL schema is in `database/schema.sql`.

## Deployment guidance

1. **Supabase:** run `database/schema.sql` in the SQL Editor. Copy the PostgreSQL connection string from Project Settings → Database. Use a server-side secret; never expose it to the browser.
2. **API (Render or similar):** create a Node service rooted at `apps/api`. Install from the monorepo root using `npm install`; build with `npm --workspace @edtech-crm/api run build`; start with `npm --workspace @edtech-crm/api start`. Provide `DATABASE_URL`, a strong `JWT_SECRET`, `WEB_ORIGIN` (your HTTPS frontend URL), `NODE_ENV=production`, and optionally `API_PORT` if required by the host.
3. **Web (Vercel or similar):** import the repository, set the root to `apps/web` or configure the host for the npm workspace. Set `NEXT_PUBLIC_API_URL` to the deployed API URL ending in `/api`, then build and deploy. If the host cannot install from the workspace root, use monorepo-aware root directory settings.
4. Run `npm run admin:create` against the production API environment once to provision the first admin. Do not place the admin password or JWT secret in source control.
5. Confirm `/api/health`, submit a test inquiry, sign in, and verify the dashboard before sharing the live links.

For separate frontend/API domains, both must use HTTPS because the production cookie is secure and cross-site. Configure the API host’s proxy/port settings according to its deployment platform.

## Notes

- No database password, JWT secret, admin account, or deployment credential is included in this project.
- The dashboard shows the latest 300 matches; pagination can be added if the assessment requires larger datasets.
- Fonts use Google Fonts with system serif/sans fallbacks.
