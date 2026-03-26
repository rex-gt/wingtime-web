# AeroBook Flight Management System - Web

Vue 3 frontend web application for AeroBook Flight Management System — a role-aware scheduling and management interface for flying clubs.

## Features

- **Mobile-First Responsive Design** — Optimized for all devices, from smartphones to desktops
- **Role-Based Access Control (RBAC)** — Admin, Operator, and Member roles with enforced permissions
- **Permission-Based UI** — Features show/hide based on the authenticated user's role
- **Smart Dashboard** — Role-filtered stats, quick actions, and navigation
- **Member Management** — Admin-only page to register new members and view all members
- **Aircraft Fleet Management** — Full CRUD for admins/operators; read-only for members
- **Reservation System** — Responsive calendar to create and manage bookings; members see only their own
- **Flight Logs** — Record and review flight hours; role-scoped data access
- **Billing** — Generate and manage billing records; members can view their own
- **Profile Management** — Edit personal info and change password
- **Password Reset** — Set password via secure email link for new members
- **Dynamic Navigation** — Responsive sidebar/drawer that adapts to role permissions
- **JWT Authentication** — Secure token-based auth with automatic renewal on page load
- **HTTPS Support** — Works with a secured backend

## Tech Stack

- **Vue 3** — Composition API with `<script setup>`
- **TypeScript** — Type-safe development
- **Vite** — Dev server and build tool
- **Vue Router** — Client-side routing with authentication and role guards
- **Pinia** — State management with permission helpers
- **Axios** — HTTP client with JWT interceptor
- **Vanilla CSS** — Custom responsive design system without external CSS frameworks

## Project Structure

```
.
├── GEMINI.md            # Project mandates and development rules
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── src/
    ├── App.vue          # Root component
    ├── main.ts          # Application entry point
    ├── style.css        # Global responsive design system & variables
    ├── components/
    │   └── AppLayout.vue # Main layout with responsive header and drawer
    ├── router/
    │   └── index.ts      # Routes with role-based navigation guards
    ├── stores/
    │   └── auth.ts       # Pinia auth store with permission logic
    ├── types/
    │   └── index.ts      # TypeScript interfaces
    ├── services/
    │   └── api.ts        # Typed API service layer
    ├── utils/
    │   └── reservations.ts # Calendar and date utility functions
    └── views/
        ├── Login.vue         # Responsive login page
        ├── ResetPassword.vue # Secure password setup
        ├── Dashboard.vue     # Main landing page with club stats
        ├── Aircraft.vue      # Fleet management
        ├── Reservations.vue  # Mobile-friendly booking calendar
        ├── FlightLogs.vue    # Flight history
        ├── Billing.vue       # Invoices and payments
        ├── Members.vue       # User administration (Admin only)
        └── Profile.vue       # Personal settings
```

## User Roles & Permissions

### Admin
Full access to everything:
- Manage members (CRUD) — `/members`
- Manage aircraft (CRUD)
- Manage all reservations
- View all flight logs
- Manage all billing

### Operator
Operational management:
- Manage aircraft (CRUD)
- Manage all reservations
- View all flight logs
- Manage billing
- Cannot manage members

### Member
Personal access only:
- View own reservations; create new reservations
- View own flight logs
- View own billing
- Cannot manage aircraft, other members' data, or billing records

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the API URL:**

   The app reads the backend URL from the `VITE_API_URL` environment variable, defaulting to `http://localhost:3000/api` for local development.

   To point to a different backend, create a `.env.local` file:
   ```env
   VITE_API_URL=https://your-api-host.up.railway.app/api
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`

## Test Users

Based on the sample data in `db/sample-data.sql`:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| operator@example.com | password123 | operator |
| member@example.com | password123 | member |

*Check `db/sample-data.sql` in the API project for actual credentials.*

## Auth Store (Pinia)

The `useAuthStore` in `src/stores/auth.ts` provides:

```typescript
// State
user        // User | null — full profile loaded from /api/users/profile
token       // string | null — JWT stored in localStorage
isAuthenticated  // computed: !!token && !!user

// Role checks (computed)
isAdmin     // true if role === 'admin'
isOperator  // true if role === 'operator'
isMember    // true if role === 'member'

// Permission checks (computed)
canManageMembers       // admin only
canManageAircraft      // admin + operator
canManageReservations  // admin + operator
canManageBilling       // admin + operator
canViewOwnData         // any authenticated user

// Actions
login(email, password)  // logs in and redirects to /dashboard
logout()                // clears state and redirects to /login
loadProfile()           // fetches /api/users/profile and populates user
```

### Usage in components

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<template>
  <!-- Role-gated button -->
  <button v-if="authStore.canManageAircraft" @click="addAircraft">
    Add Aircraft
  </button>

  <!-- Access denied message -->
  <div v-if="!authStore.canManageMembers" class="alert alert-error">
    Access Denied: Admin only
  </div>

  <!-- Dynamic label based on role -->
  <h3>{{ authStore.isAdmin || authStore.isOperator ? 'All' : 'My' }} Reservations</h3>
</template>
```

## Routing

Routes are defined in `src/router/index.ts`. Navigation guards enforce authentication and role requirements:

| Route | Auth Required | Admin Only |
|-------|--------------|-----------|
| `/login` | No | No |
| `/reset-password` | No | No |
| `/dashboard` | Yes | No |
| `/aircraft` | Yes | No |
| `/reservations` | Yes | No |
| `/flight-logs` | Yes | No |
| `/billing` | Yes | No |
| `/profile` | Yes | No |
| `/members` | Yes | Yes |

Unauthenticated users are redirected to `/login`. Non-admins visiting `/members` are redirected to `/dashboard`. The `/reset-password` route accepts a `?token=` query parameter from welcome emails.

## API Service

`src/services/api.ts` exports typed API clients for all endpoints:

```typescript
authAPI.login(email, password)
authAPI.getProfile()
authAPI.updateProfile(data)

membersAPI.getAll() | getById(id) | create(data) | update(id, data) | delete(id)
aircraftAPI.getAll() | getById(id) | create(data) | update(id, data) | delete(id)
reservationsAPI.getAll() | getById(id) | create(data) | update(id, data) | delete(id)
flightLogsAPI.getAll() | getById(id) | create(data) | update(id, data) | delete(id)
billingAPI.getAll() | generate(flightLogId) | markPaid(id) | getSummary(memberId) | delete(id)
```

The Axios instance automatically attaches the JWT from `localStorage` to every request via a request interceptor.

## TypeScript Types

Core types defined in `src/types/index.ts`:

- `Role` — `'admin' | 'operator' | 'member'`
- `User` — authenticated user profile
- `Member` — club member record (includes `role`)
- `Aircraft` — fleet aircraft
- `Reservation` — booking with status (`scheduled | completed | cancelled`)
- `FlightLog` — flight record with computed `tach_hours`
- `BillingRecord` — billing per flight log
- `AuthResponse` — login token response

## Build for Production

```bash
npm run build
```

Output is placed in `dist/`. The build uses `vue-tsc` for type checking before bundling.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api` | Backend API base URL |

Create `.env.production` for production builds:
```env
VITE_API_URL=https://your-api-host.up.railway.app/api
```

## Deployment

### Vercel / Netlify
1. Build: `npm run build`
2. Deploy `dist/` folder
3. Add `VITE_API_URL` as an environment variable in the dashboard
4. Update CORS `ALLOWED_ORIGINS` in the backend to include the deployed frontend URL

### Backend CORS
The API backend reads allowed origins from `ALLOWED_ORIGINS` (comma-separated, supports `*.domain.com` wildcards). Add your frontend URL there.

## Troubleshooting

**"Access Denied" on every page**
- Verify the user's `role` is set correctly in the database
- Clear `localStorage` and log in again to refresh the JWT

**Can't see any data**
- Members only see their own records — ensure reservations/flights are linked to your user ID
- Admins and operators see all records

**Login succeeds but the UI doesn't reflect the correct role**
- Clear `localStorage` and log in again; the role is loaded from `/api/users/profile` after login

## License

MIT
