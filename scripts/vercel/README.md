# AeroBook Web Deployment Guide (4 Environments)

This document explains the four distinct environments for the AeroBook Web project and how to manage them using the Vercel CLI.

## 1. Environment Overview

| Environment | Purpose | Target URL | Backend API | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Local Development | `http://localhost:5173` | `https://localhost:3000/api` | `npm run dev` |
| **Development** | Hosted Dev/Test | (Vercel Preview URL) | `...-api-staging.up.railway.app` | `npm run deploy:dev` |
| **Preview** | Shared Preview | `https://preview.aerobook.app/` | `...-api-staging.up.railway.app` | Push to `preview` branch |
| **Production** | Live Production | `https://aerobook.app/` | `...-api-production.up.railway.app` | Push to `main` branch |

## 2. Environment Configuration (.env Files)

The project uses four separate `.env` files as the source of truth:

- `.env.development.local`: Local development settings.
- `.env.development`: Settings for the hosted Development environment.
- `.env.preview`: Settings for the Shared Preview environment.
- `.env.production`: Settings for the Live Production environment.

### Syncing to Vercel

To push all your local `VITE_API_URL` values to Vercel's remote settings:

```bash
npm run env:sync
```
*This uses `scripts/vercel/sync-envs.sh` under the hood.*

## 3. Deployment Workflow

### Interactive Menu (Recommended)
The project includes an interactive script to help you deploy to any environment:

```bash
npm run deploy
```
*This uses `scripts/vercel/deploy.sh`.*

### Manual CLI Commands
You can also trigger deployments directly using these scripts:

- **Deploy to Development**: `npm run deploy:dev`
- **Deploy to Production**: `npm run deploy:prod`

## 4. Automatic CI/CD

### Preview Deployment
Any push to the **`preview`** branch on GitHub will automatically trigger a deployment to `https://preview.aerobook.app/`.

### Production Deployment
Any merge/push to the **`main`** branch on GitHub will automatically trigger a deployment to `https://aerobook.app/`.

## 5. Security & Tokens

### VERCEL_OIDC_TOKEN
This token is used by Vercel for internal authentication (e.g., Data Cache). It is automatically injected by Vercel in cloud environments. For local debugging, it is stored in `.env.development`. You **do not** need to manually sync this token to Vercel.

---

## Quick Reference Commands

- `npm run dev` - Start local development
- `npm run env:sync` - Push local .env values to Vercel
- `npm run deploy` - Open the interactive deployment menu
- `vercel env ls` - View all environment variables on Vercel
- `vercel ls` - List all active deployments
