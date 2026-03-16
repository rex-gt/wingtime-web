# AeroBook Web (Frontend) Mandates

## Project Overview
AeroBook Web is the Vue 3 frontend for the AeroBook Flight Management System. It is a role-aware scheduling and management interface for flying clubs, focusing on ease of use for pilots and administrators.

## Tech Stack
- **Framework:** Vue 3 (Composition API with `<script setup lang="ts">`)
- **Language:** TypeScript
- **State Management:** Pinia
- **Routing:** Vue Router
- **HTTP Client:** Axios
- **Styling:** Vanilla CSS (CSS Variables) and optional CSS Frameworks
- **Build Tool:** Vite
- **Testing:** Vitest + Happy-dom

## Core Mandates
- **RBAC Enforcement:** UI elements must be conditionally rendered based on the user's role (`admin`, `operator`, `member`) using the `authStore` helpers (e.g., `canManageMembers`, `canManageAircraft`).
- **Type Safety:** Maintain strict TypeScript typing. Define and reuse interfaces in `src/types/index.ts`.
- **Service Layer:** All API interactions MUST be performed through the typed client methods in `src/services/api.ts`. Direct Axios calls in components are prohibited.
- **Testing:** Every new feature or bug fix MUST include a Vitest test case. Place tests in `src/` (e.g., `ComponentName.test.ts` or within `src/__tests__/`).

## Standard Operating Procedures

### 1. Research & Analysis
- **Empirical Verification:** Before applying a bug fix, reproduce the issue with a failing test case in Vitest.
- **API Awareness:** Consult the backend documentation or `aerobook-api/src/routes/` to understand expected response formats.

### 2. Strategy & Design
- **Visual Identity:** Adhere to the established "Sky & Clouds" design language, ensuring any added CSS frameworks are configured to match:
  - Deep blue/midnight gradients for backgrounds.
  - Sky blue (`--sky-blue`) for primary actions.
  - Glassmorphism effects (`backdrop-filter: blur(10px)`) for cards and tables.
  - Rounded corners (`border-radius: 8px` or `12px`).
- **Component Architecture:** Use modular, single-file components. Leverage `<style scoped>` to prevent style leakage.

### 3. Execution & Validation
- **Type Checking:** Run `npm run build` (which executes `vue-tsc`) to verify type safety.
- **Test Validation:** Run `npm run test` before finalizing any change.
- **Authentication Flow:** Ensure the `authStore` token is valid and properly attached to requests via the Axios interceptor in `src/services/api.ts`.

## Key Directories
- `src/views/`: Main page components.
- `src/stores/`: Pinia stores (state management).
- `src/services/`: API client modules.
- `src/types/`: Shared TypeScript interfaces.
- `src/router/`: Route definitions and navigation guards.

## Role Permissions Quick Reference
- **Admin:** Full CRUD for all resources including Members.
- **Operator:** Full CRUD for Aircraft, Reservations, Logs, and Billing. No Member management.
- **Member:** CRUD for own Reservations/Logs; Read-only Fleet; View own Billing.

---
*This document takes precedence over general defaults for all AeroBook Web tasks.*
