# ClassMaster (tuition-manager)

All-in-one tuition class management system. Now powered by **Cloudflare Workers** and **D1 Database**.

## Features
- **Multi-tenant isolation**: Every user has their own data workspace.
- **D1 Database**: High-performance SQLite on the edge.
- **JWT Authentication**: Secure, stateless user sessions.
- **Quasar Frontend**: Modern, responsive UI.

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Workers & D1
- Create a D1 database in Cloudflare dashboard.
- Update `wrangler.toml` with your `database_id`.
- Apply schema:
```bash
npx wrangler d1 execute classmaster-db --file=./schema.sql
```

### 3. Environment Variables
Create a `functions/api/.env` (or set in Cloudflare dashboard):
- `JWT_SECRET`: Your secret key for signing tokens.

### 4. Run Quasar Dev Server
```bash
quasar dev
```

## Deployment

Deploy to Cloudflare Pages & Workers:
```bash
npm run build
npx wrangler pages deploy dist/spa
```

## Technology Stack
- **Frontend**: Vue 3, Quasar Framework, Pinia.
- **Backend**: Cloudflare Pages Functions (Node.js compat).
- **Database**: Cloudflare D1 (SQLite).
- **Auth**: Custom JWT implementation.

---
Built with ❤️ by ClassMaster Team.
