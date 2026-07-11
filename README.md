# CRM Management System

Enterprise-grade customer relationship management platform with modular architecture, role-based access control, real-time notifications, and integrated AI assistance.

## Overview

CRM Management System is a full-stack web application for managing contacts, sales pipelines, tasks, communications, documents, reports, and team operations. The backend follows a layered module pattern. The frontend is a single-page application with protected routes and permission-aware navigation.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Authentication | Supabase Auth (JWT) |
| File Storage | Supabase Storage |
| Email | Brevo Transactional API |
| AI Assistant | OpenRouter API |
| Real-time | Socket.io |
| Security | Helmet, CORS, rate limiting, RBAC |

## System Architecture

### Backend Layering

Each feature module uses a consistent structure:

```
Routes -> Controllers -> Services -> Repositories/Models -> Database
```

Cross-cutting concerns live in dedicated folders:

- `config/` — environment, database, security, Supabase, Brevo, Socket.io
- `middleware/` — authentication, RBAC, validation
- `shared/` — errors, permissions, roles, utilities
- `jobs/` — scheduled automation tasks

### Frontend Layering

```
pages/ -> components/ -> context/ + hooks/ -> lib/api.js
```

State is managed through React Context for authentication, language, and socket notifications.

### Project Structure

```
crm-management-system/
├── backend/
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── jobs/
│       ├── middleware/
│       ├── modules/
│       │   ├── activity/
│       │   ├── ai/
│       │   ├── auth/
│       │   ├── automation/
│       │   ├── communications/
│       │   ├── contacts/
│       │   ├── deals/
│       │   ├── documents/
│       │   ├── notifications/
│       │   ├── reports/
│       │   ├── settings/
│       │   ├── tasks/
│       │   └── user/
│       └── shared/
└── frontend/
    └── src/
        ├── components/
        │   ├── ai/
        │   ├── layout/
        │   └── ui/
        ├── context/
        ├── data/
        ├── hooks/
        ├── lib/
        └── pages/
```

## Security

### Authentication

- Supabase handles identity, password reset, email verification, and Google OAuth
- Backend validates JWT on every protected request via `verifySupabaseToken` and `authenticate`
- MongoDB stores application profiles linked by `supabaseId`

### Authorization

- Role-based access control with granular permissions (`resource:action`)
- Route-level permission guards on backend and frontend
- Users cannot change their own role; only administrators can assign admin

### API Protection

- Helmet security headers
- CORS restricted to configured frontend origin
- Rate limiting on general API, auth, sync, and upload endpoints
- Input validation with Zod schemas
- File upload type and size restrictions

### Data Protection

- HTTPS required in production
- Supabase Storage for private document and avatar assets
- Signed URLs for stored files
- Activity audit logging for sensitive operations

### Environment Variables

Never commit `.env` files. Store API keys and secrets only in environment configuration. Rotate keys if exposed.

## Prerequisites

- Node.js 18 or later
- MongoDB (local or Atlas)
- Supabase project
- Brevo API key (transactional email)
- OpenRouter API key (AI assistant, optional)

## Installation

### 1. Supabase

1. Create a project at https://supabase.com
2. Enable Email authentication under Authentication > Providers
3. Configure URL settings:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `/auth/callback`, `/reset-password`, `/verify-email`, `/dashboard`
4. Optional: enable Google OAuth provider
5. Create a private Storage bucket named `crm-documents`
6. Copy project URL, anon key, and service role key

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```



### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```



## Application Modules

### Core

| Module | Description |
|--------|-------------|
| Dashboard | KPIs, charts, recent activity, overdue tasks |
| Settings | Profile, language, company, custom fields, users |
| Activity Log | Audit trail of user and system actions |

### CRM Operations

| Module | Description |
|--------|-------------|
| Contacts | Leads, contacts, customers, import/export, duplicates |
| Deals | Kanban sales pipeline with stage management |
| Tasks | Task management and calendar view |
| Communications | Email sending, activity logging, templates |
| Documents | File upload and attachment to records |
| Reports | Sales analytics and export |

### Platform Services

| Module | Description |
|--------|-------------|
| Users | Role assignment and user administration |
| Notifications | Real-time alerts via Socket.io |
| AI Assistant | In-app help powered by OpenRouter |
| Automation | Welcome emails, follow-up tasks, lead assignment |

### Legal Pages

| Route | Description |
|-------|-------------|
| /legal/faqs | Product documentation and FAQs |
| /legal/privacy | Privacy policy |
| /legal/terms | Terms of service |

Support guidance on legal pages directs users to the CRM AI Assistant.

## Roles and Permissions

| Role | Access Summary |
|------|----------------|
| Admin | Full platform access |
| Manager | Users, activity, CRM modules, reports |
| Sales Rep | Contacts, deals, tasks, communications, documents |
| Support | Users (view), CRM modules |
| HR | Users, activity, profile |

The first user or an email listed in `ADMIN_EMAILS` receives the admin role automatically.

## Authentication Flow

1. User authenticates through Supabase on the frontend
2. Frontend calls `POST /api/auth/sync` to load or create the MongoDB profile
3. All API requests include the Supabase JWT in the Authorization header
4. Backend verifies the token and enforces permissions per route

## API Reference

### Auth

- `POST /api/auth/register` — Create profile after signup
- `POST /api/auth/sync` — Sync session on login
- `GET /api/auth/me` — Current user profile
- `GET /api/auth/roles` — Available roles
- `GET /api/auth/permissions` — Permission catalog

### Users

- `GET /api/users/profile` — Own profile
- `PUT /api/users/profile` — Update own profile
- `POST /api/users/profile/avatar` — Upload avatar
- `GET /api/users` — List users
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Deactivate user

### CRM

- `/api/contacts` — Contact CRUD, import, export, duplicates
- `/api/deals` — Deal CRUD and stage updates
- `/api/tasks` — Task CRUD and calendar
- `/api/communications` — Logs, email send, templates, delete
- `/api/documents` — Upload, download, delete
- `/api/reports` — Dashboard metrics and export

### Platform

- `/api/activity` — Audit logs
- `/api/notifications` — Notification feed
- `/api/settings` — Company and field configuration
- `/api/ai` — AI assistant status and chat

## Deployment

Deployment will be configured in a future update. For now, run the project locally using the setup steps above.

## Testing Checklist

Before deployment, verify:

- Login and signup (email and Google)
- Dashboard loads without permission errors
- Contacts create, edit, delete, import
- Customer welcome email automation
- Deals pipeline drag and drop
- Tasks create and calendar
- Communications send and delete
- Documents upload
- Reports export
- Settings profile and admin sections
- AI assistant chat response
- Real-time notifications
- Legal pages render correctly

## License

Proprietary. All rights reserved.
