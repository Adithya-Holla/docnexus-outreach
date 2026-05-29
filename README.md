# DocNexus Outreach Platform

A physician outreach CRM for life sciences teams to discover HCPs, build multi-step email campaigns, and track engagement — built as an internship engineering assignment.

---

## Overview

DocNexus Outreach is a full-stack SaaS application that gives pharmaceutical marketing managers, Medical Science Liaisons, and medical device representatives a structured workflow for HCP outreach. Users discover physicians from a searchable database, enroll them into campaigns, and send templated email sequences — all from a single interface.

The platform handles the full outreach lifecycle: physician discovery with faceted filtering, campaign creation with multi-step sequences, AI-assisted email generation via OpenRouter, actual email delivery through Resend, and real-time analytics tracking opens, replies, bounces, and meetings booked. Each campaign and its data is scoped to the authenticated user.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, API routes, and file-based routing in a single repo |
| Language | TypeScript (strict) | End-to-end type safety; shared types between API and UI |
| Database | PostgreSQL via Neon | Serverless-compatible, free tier, first-class Vercel integration |
| ORM | Prisma 5 | Type-safe queries, migration management, schema-as-code |
| Auth | JWT + bcrypt (jose, bcryptjs) | Stateless sessions via HTTP-only cookies; no third-party auth dependency |
| UI | Tailwind CSS + shadcn/ui | Utility-first styling with accessible, unstyled primitives |
| Forms | React Hook Form + Zod | Performant uncontrolled forms with shared schema validation |
| Charts | Recharts | Composable chart primitives that integrate cleanly with React |
| AI | OpenRouter (gpt-oss-20b) | Provider-agnostic LLM gateway; free tier for development |
| Email | Resend | Developer-friendly transactional email with webhook support |
| Testing | Jest + ts-jest | Unit tests for the template engine logic |

---

## Architecture

The application follows a standard Next.js App Router layout. Server components handle authentication checks and initial data fetching. Client components manage interactive state (filters, form steps, selections). API routes are thin — they validate input with Zod, delegate to Prisma, and return JSON.

```
src/
  app/
    (auth)/          # Login and registration pages
    (app)/           # Authenticated app shell
      physicians/    # Physician discovery
      campaigns/     # Campaign list, builder, dashboard, edit
    api/
      auth/          # Login, register, logout, session
      physicians/    # Filtered physician search
      campaigns/     # CRUD + launch
      enrollments/   # Manual event recording
      ai/            # OpenRouter email generation
      track/         # Open-tracking pixel
      webhooks/      # Resend event webhooks
  components/
    physicians/      # PhysicianCard, PhysicianGrid, FilterSidebar, SelectionBar
    campaigns/       # CampaignForm, SequenceStep, GenerateButton, PreviewPanel
    dashboard/       # MetricCard, ActivityChart, EnrollmentTable
    layout/          # LayoutShell, Sidebar, TopBar
    ui/              # shadcn/ui primitives + ErrorBoundary, Toast, Tooltip
  lib/
    prisma.ts        # Prisma client singleton
    auth.ts          # JWT sign/verify, bcrypt helpers
    templateEngine.ts# {{variable}} substitution for email templates
    campaignAnalytics.ts # Metrics aggregation from EmailEvent records
    emailSender.ts   # Resend integration with simulation fallback
  hooks/
    usePhysicians.ts # URL-synced filter + fetch hook
    useCampaign.ts   # Campaign create/update/launch mutations
    use-toast.ts     # Module-level toast singleton
```

Authentication is enforced by a Next.js middleware that validates the JWT on every request, redirecting unauthenticated users to `/login`. Campaign data is scoped to the owning user at the API layer.

---

## Modules

**Physician Discovery**
Searchable, filterable database of 25 HCPs across six specialties. Filters (specialty, state, affiliation, NPI registration year, name search) are URL-synced so they survive page refreshes and can be shared as links. Physicians are selected via checkbox cards; the selection bar slides up at the bottom of the screen and routes directly into the campaign builder.

**Campaign Builder**
A three-step wizard (details, sequence, review) that produces a named campaign with one or more email steps. Each step has a subject template, body template, and send-delay in days. Template variables (`{{doctor_name}}`, `{{specialty}}`, `{{affiliation}}`, etc.) are inserted via chip buttons or AI generation. Campaigns can be saved as draft for later editing and launching, or launched immediately against a physician selection.

**Campaign Dashboard**
Per-campaign analytics showing messages sent, delivered, open rate, replies, meetings booked, and bounce rate — all derived from real `EmailEvent` records written by the Resend webhook and the tracking pixel. An activity chart shows outreach volume over the last seven days. The enrollment table lists each physician with their current status and manual action buttons (Replied, Book Meeting, Bounced) for updating status without waiting for automated webhook events.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier is sufficient)
- An [OpenRouter](https://openrouter.ai) API key
- A [Resend](https://resend.com) account (required only for live email sending)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adithya-Holla/docnexus-outreach.git
   cd docnexus-outreach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   See the [Environment Variables](#environment-variables) section for details on each variable.

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed physician data**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The app is available at `http://localhost:3000`. Register an account to get started.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) — from your Neon project dashboard |
| `DIRECT_URL` | Yes | PostgreSQL direct connection string (non-pooled) — used by Prisma migrate |
| `JWT_SECRET` | Yes | Secret for signing session tokens. Use a random string of 32+ characters |
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter — used by the AI email generation endpoint |
| `RESEND_API_KEY` | No | Resend API key. If omitted, the app runs in simulation mode (emails logged to console) |
| `RESEND_FROM_EMAIL` | No | Verified sender address in your Resend dashboard (e.g. `outreach@yourdomain.com`) |
| `APP_BASE_URL` | No | Public URL of the deployment — embedded in email tracking pixel URLs. Defaults to `http://localhost:3000` |

---

## API Reference

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account; returns a session cookie |
| `POST` | `/api/auth/login` | Authenticate with email and password; returns a session cookie |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Return the current authenticated user |

### Physicians

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/physicians` | List physicians with optional filters: `specialty`, `state`, `affiliation`, `yearFrom`, `yearTo`, `search` |

### Campaigns

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/campaigns` | List all campaigns belonging to the authenticated user |
| `POST` | `/api/campaigns` | Create a new campaign with sequence steps |
| `GET` | `/api/campaigns/:id` | Fetch a single campaign with enrollments and analytics |
| `PATCH` | `/api/campaigns/:id` | Update a draft campaign's name, type, and sequence steps |
| `DELETE` | `/api/campaigns/:id` | Delete a campaign and all associated data (cascades) |
| `PATCH` | `/api/campaigns/:id/launch` | Transition campaign from draft to active; enrolls physicians and sends step-1 emails |

### Enrollments

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/enrollments/:enrollmentId/events` | Record a manual event (`REPLIED`, `BOUNCED`, `MEETING_BOOKED`) for an enrollment |

### AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/generate` | Generate a subject and body template using OpenRouter. Accepts physician context, campaign type, and step number |

### Tracking and Webhooks

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/track/open` | 1×1 tracking pixel; records an `OPENED` event when an email client loads it |
| `POST` | `/api/webhooks/email` | Resend webhook receiver; processes `DELIVERED`, `OPENED`, `REPLIED`, and `BOUNCED` events |

---

## Screenshots

[Screenshots coming — see video demo below]

---

## Design Decisions

- **URL-synced filters on physician discovery.** Filter state lives in the URL query string rather than React state. This means filters survive page refresh, can be bookmarked, and are automatically handled by the browser back button — with zero extra state management code.

- **Template engine with `{{variable}}` syntax.** Email personalization uses a lightweight string substitution approach instead of a full template library. This keeps the implementation simple, makes templates readable and editable by non-engineers, and avoids a dependency. The engine is fully unit tested.

- **Event-sourced analytics.** Rather than storing computed counters, every email lifecycle event (sent, delivered, opened, replied, bounced) is written as an immutable `EmailEvent` row. Analytics are computed at read time. This means historical data is never lost, and the metrics recalculate correctly when new event types are added.

- **Simulation mode for email sending.** When `RESEND_API_KEY` is not configured, `emailSender.ts` logs what would be sent instead of throwing an error. This allows the full campaign launch flow to be exercised locally without a Resend account, and avoids accidentally sending emails in development.

- **JWT in HTTP-only cookies rather than `localStorage`.** Session tokens are inaccessible to JavaScript, which eliminates the XSS token-theft vector. The `SameSite=Lax` attribute provides CSRF protection for state-mutating requests. The `Secure` flag is added automatically in production.

---

## What I'd Build Next

1. **NPI Registry API integration.** Replace the static seed data with a live query against the CMS NPI Registry API. Users could search the full database of 7M+ licensed providers and import any physician directly into the platform, keeping data current without manual maintenance.

2. **HIPAA audit logging.** Introduce an immutable `AuditLog` table that records every data access and mutation with user ID, timestamp, IP address, and action type. This is a prerequisite for any real commercial deployment in the healthcare space and would demonstrate understanding of compliance requirements.

3. **A/B sequence testing.** Allow campaigns to define two sequence variants and split the enrolled physician list between them. Track open rates and reply rates per variant and surface a winner after statistical significance is reached. This would give MSLs data-driven feedback on which messaging approach works.

4. **Salesforce CRM sync.** Add a one-way sync that pushes campaign enrollments and engagement events to Salesforce as Activities on the corresponding Contact record. Life sciences field teams live in Salesforce; integrating DocNexus data there removes the need to switch tools and increases adoption.

5. **Scheduled follow-up dispatch.** The `delayDays` field on each sequence step is stored in the database but emails beyond step 1 are not yet sent automatically. Building a background job (via Vercel Cron or a queue) to check for due dispatches and send them would complete the multi-step sequence functionality.

---

## Video Demo

[Loom walkthrough — link coming]
