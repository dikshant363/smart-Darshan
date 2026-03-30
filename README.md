# Smart-Darshan

A Vite + React + TypeScript app for temple visit management (booking, crowd, queue, parking, emergency support).

## Project info

**Lovable URL**: https://lovable.dev/projects/8bf1e2b6-d5dc-4af9-a65f-4c1f109127a3

## Run locally

### Requirements
- Node.js 18+ (Node.js 20+ recommended)
- npm 9+

### Setup and start
```sh
# 1) install dependencies
npm install

# 2) run development server
npm run dev

# 3) build for production (sanity check)
npm run build

# 4) preview production build (optional)
npm run preview
```

## Common issues and fixes

### `vite: not found`
This means dependencies were not installed yet (or `node_modules` was removed). Run:

```sh
npm install
```

### `Cannot find package '@eslint/js'` while running lint
This is also caused by missing dependencies. Reinstall packages:

```sh
npm install
```

### Lockfile conflicts (`package-lock.json` vs `bun.lockb`)
Use **npm** for this repo to keep installs consistent with project scripts.

## Editing options

### Use Lovable
Visit the [Lovable project](https://lovable.dev/projects/8bf1e2b6-d5dc-4af9-a65f-4c1f109127a3) and prompt changes directly.

### Use your IDE
Clone the repository, edit locally, and push changes.

## Tech stack

- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS
- Supabase

## Deployment

Use Lovable: **Share → Publish**.

## Custom domain

You can connect a custom domain from Lovable settings.

Reference: https://docs.lovable.dev/features/custom-domain#setting-up-a-custom-domain
