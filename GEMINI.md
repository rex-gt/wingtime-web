# AeroBook Web Project Mandates & Standards

This document defines the foundational mandates, architectural standards, and development workflows for the AeroBook Web project. As Gemini CLI, I MUST strictly adhere to these rules.

## 1. Core Mandates

### Source Control & User Approval
- **NO AUTONOMOUS COMMITS:** Never stage or commit changes without explicit user approval.
- **REVIEW FIRST:** Always present a structured summary of changes and offer a full `git diff` before requesting a commit.
- **COMMIT MESSAGES:** Propose clear, concise commit messages following conventional commits (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).

### Verification & Quality
- **TESTING FIRST:** Always run `npm test` before proposing any code changes to ensure no regressions.
- **EMPIRICAL REPRODUCTION:** For bug fixes, always attempt to reproduce the issue with a test case or script before applying the fix.
- **RESPONSIVE BY DEFAULT:** Every new UI component or view must be mobile-friendly, adhering to the project's responsive design system.

---

## 2. Architectural Standards

### Component Structure (Vue 3)
- Use the **Composition API** with `<script setup lang="ts">`.
- Keep components focused and small. Extract reusable logic into composables if used across multiple views.
- **Layouts:** Use `AppLayout.vue` as the primary wrapper for authenticated views.

### State Management (Pinia)
- Use **Pinia** for global state (Auth, User Profile).
- Enforce **Role-Based Access Control (RBAC)** using computed properties in the `auth` store (e.g., `isAdmin`, `canManageAircraft`).
- Do not store transient UI state in global stores; keep it local to the component.

### API Service Layer
- Use the centralized Axios instance in `src/services/api.ts`.
- All API methods MUST be typed using the interfaces defined in `src/types/index.ts`.
- Always handle API errors gracefully, providing user-friendly messages.

---

## 3. Coding & Styling Standards

### TypeScript
- Maintain strict type safety. Avoid using `any` unless absolutely necessary.
- Define shared interfaces in `src/types/index.ts`.

### CSS & Styling
- **Vanilla CSS:** Prefer scoped Vanilla CSS for component-specific styling.
- **Design System:** Use the CSS variables defined in `:root` (in `style.css`) for colors and spacing.
- **Utility Classes:** Utilize global utility classes like `.mobile-only`, `.desktop-only`, and `.table-container` for responsive behavior.
- **Typography:** Use 'Outfit' for body text and 'Space Mono' for technical/data values.

### Responsive Breakpoints
- **Mobile:** `< 480px`
- **Tablet:** `480px - 768px`
- **Desktop:** `> 768px` (Main container max-width: `1400px`)

---

## 4. Development Workflow

1.  **Research:** Map relevant files and understand dependencies.
2.  **Strategy:** Present a concise plan for the requested change.
3.  **Implementation:** Apply surgical updates, ensuring consistency with existing patterns.
4.  **Validation:** 
    - Run `npm test`.
    - Audit CSS for responsiveness.
    - Verify role-based permissions if the change affects access.
5.  **Review:** Present changes to the user for approval.
6.  **Commit:** Perform the commit only after explicit user confirmation.
