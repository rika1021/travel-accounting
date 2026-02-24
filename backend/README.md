# Travel Accounting Backend

Node.js + TypeScript + Hono + PostgreSQL backend for the travel accounting app.

## Project Structure

```
backend/
├── src/
│   ├── db.ts        # PostgreSQL pool setup
│   ├── app.ts       # Hono app initialization
│   ├── index.ts     # Server entrypoint
│   ├── db/          # Database queries (empty for now)
│   ├── routes/      # API route handlers (empty for now)
│   └── types/       # TypeScript type definitions (empty for now)
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (use `.env.example` as reference):
   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string.

## Scripts

- **dev**: Start development server with hot reload
  ```bash
  npm run dev
  ```

- **build**: Compile TypeScript to JavaScript
  ```bash
  npm run build
  ```

- **start**: Run compiled server
  ```bash
  npm start
  ```

## Environment Variables

- `DATABASE_URL` (required): PostgreSQL connection string
- `PORT` (optional): Server port, defaults to 3000

## Health Check

Test if the server is running:
```bash
curl http://localhost:3000/health
```

Response:
```json
{ "status": "ok" }
```
