# Spendly Product Spec and Implementation Plan

## 1. Product Summary

Spendly is a mobile-first personal finance tracker that lets users record income and expenses in plain English, then uses an AI parser to convert text into structured transactions. The product should feel fast, touch-friendly, and usable one-handed on phones while still working cleanly on desktop.

## 2. Goals

- Let users add a transaction in under 10 seconds from a phone.
- Parse natural language input into amount, type, category, date, and description with minimal manual correction.
- Show clear financial summaries for monthly and yearly spending.
- Keep the experience responsive, accessible, and installable as a PWA on mobile devices.
- Keep API keys server-side and enforce row-level security.

## 3. Target Users

- Individuals tracking daily spending on mobile.
- Users who prefer typing natural phrases over filling forms.
- People who need quick weekly and monthly insight into income, expenses, and savings.

## 4. Product Principles

- Mobile-first by default, desktop-compatible by design.
- One primary action per screen.
- Minimal typing friction and minimal navigation depth.
- Clear feedback after parsing, saving, or error states.
- Structured data must always be reviewable before persistence.

## 5. Core User Flows

### 5.1 Authentication

1. User signs up or logs in with Supabase Auth.
2. Session is stored securely and reused across app launches.
3. Authenticated users land on the dashboard.

### 5.2 Add Transaction

1. User types a natural language sentence.
2. Frontend sends the text to the backend parser.
3. Backend returns structured JSON with type, amount, category, description, and date.
4. User reviews the parsed result.
5. User confirms and saves the transaction.

### 5.3 View Analytics

1. User opens monthly or yearly analytics.
2. App fetches aggregated totals and category breakdowns.
3. Charts and summary cards update based on selected time period.

### 5.4 Manage Transactions

1. User browses transaction history.
2. User filters by type, category, or date range.
3. User deletes or edits a transaction.

## 6. Functional Requirements

### 6.1 Transaction Parsing

- Accept natural language input such as “100 rs for panipuri”.
- Extract amount, type, category, description, and date.
- Normalize currency terms and relative dates.
- Return a structured response before saving.

### 6.2 Transaction Storage

- Persist transactions per authenticated user.
- Support create, read, delete, and update operations.
- Keep raw input for traceability.

### 6.3 Categories

- Provide global default categories.
- Allow user-defined categories.
- Support category colors and icons for display consistency.

### 6.4 Analytics

- Show monthly income, expense, and net values.
- Show yearly rollups by month.
- Show category-wise breakdowns.

### 6.5 Mobile UX

- Use a bottom navigation bar on small screens.
- Keep primary actions reachable with thumb-friendly touch targets.
- Respect safe areas on iOS devices.
- Prevent accidental zoom on form fields by maintaining readable base font size.

## 7. Non-Functional Requirements

- Responsive layout across mobile, tablet, and desktop.
- Fast initial load and quick interaction feedback.
- Accessible contrast, focus states, and readable typography.
- Secure secrets management and authenticated APIs.
- Reliable parsing with fallback error handling when the model output is invalid.

## 8. Mobile-First Design Requirements

The UI should be designed from the smallest screen upward.

- Single-column layouts on mobile.
- Large primary buttons and clear spacing.
- Persistent bottom navigation for core sections.
- Compact summary cards before charts or tables.
- Minimal modal usage; prefer inline sheets or expandable panels.
- PWA support with install prompt, manifest, and safe-area handling.

## 9. Recommended Information Architecture

- Dashboard
- Add Transaction
- Monthly Analytics
- Yearly Analytics
- Transactions History
- Settings
- Auth screens

## 10. System Architecture

### Frontend

- React + Vite application.
- Tailwind CSS for responsive styling.
- Recharts for analytics visualization.
- Supabase client for auth and session handling.

### Backend

- FastAPI service for routes, validation, and orchestration.
- ChatGroq parser for text-to-JSON transaction extraction.
- Supabase client for data persistence and aggregation.

### Database

- Supabase/PostgreSQL for transactions, categories, and auth integration.
- Row-level security to isolate each user’s data.

## 11. Implementation Plan

### Phase 1: Foundation

- Confirm the product scope and primary user flows.
- Set up the repository structure for frontend, backend, and database assets.
- Define environment variables and deployment targets.
- Establish naming conventions and coding standards.

### Phase 2: Backend Core

- Build FastAPI app bootstrap, CORS, and health endpoint.
- Implement auth verification with Supabase JWT.
- Add parser endpoint and parser service.
- Add transaction CRUD endpoints.
- Add analytics aggregation endpoints.

### Phase 3: Database Layer

- Create transactions and categories tables.
- Add seed categories.
- Add row-level security policies.
- Add aggregation SQL functions if needed.

### Phase 4: Frontend Core

- Build auth screens and session handling.
- Build dashboard with summary cards and recent transactions.
- Build natural language add-transaction flow.
- Build transaction list and filter experience.
- Build monthly and yearly analytics pages.

### Phase 5: Mobile UX Polish

- Add bottom navigation.
- Tune spacing, typography, and touch targets for phones.
- Add safe-area handling for iOS devices.
- Add PWA metadata and installability support.

### Phase 6: Quality and Release

- Add backend tests for parsing, CRUD, and analytics.
- Validate responsive behavior on common mobile breakpoints.
- Test on iPhone Safari and Android Chrome.
- Deploy backend and frontend.

## 12. Milestones

### Milestone A: Working Backend

- Health check responds.
- Auth verification works.
- Parse endpoint returns structured JSON.
- Transactions can be created and listed.

### Milestone B: Usable Frontend

- User can log in, add a transaction, and view history.
- Dashboard reflects live data.
- Monthly and yearly analytics render from real API responses.

### Milestone C: Mobile-Ready Product

- App feels native on mobile.
- Bottom navigation is stable.
- PWA install flow works.
- Layout is readable and usable at narrow widths.

### Milestone D: Production Readiness

- Tests pass.
- Secrets are configured correctly.
- RLS is enabled and verified.
- Deployments are reproducible.

## 13. Acceptance Criteria

- A user can enter a sentence like “100 rs for panipuri” and save it as a transaction.
- Monthly and yearly summaries reflect saved data correctly.
- Users cannot access each other’s transactions.
- The UI remains usable on a phone viewport without horizontal scrolling.
- The app can be installed as a PWA on supported mobile devices.

## 14. Risks and Mitigations

- Parser ambiguity: validate parsed output before saving and allow user edits.
- Mobile layout regressions: test at representative narrow widths early.
- API latency: show loading states and cache data where possible.
- Auth/session issues: keep token handling centralized in the frontend client.

## 15. Suggested Build Order

1. Backend health, config, and auth.
2. Database schema, seed data, and security policies.
3. Parser endpoint and validation layer.
4. Transaction CRUD.
5. Analytics endpoints.
6. Authenticated frontend shell.
7. Add transaction flow.
8. Dashboard, analytics, and transaction history.
9. Mobile polish and PWA configuration.
10. Testing, deployment, and release hardening.

## 16. Definition of Done

- The app works end to end for authenticated users.
- The mobile experience is smooth, responsive, and installable.
- Core routes have validation and automated tests.
- Documentation reflects the actual architecture and setup steps.