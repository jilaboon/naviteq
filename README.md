# Naviteq Internal Management System

A modern web application for managing customers, projects, and candidates. Built as a Monday.com alternative tailored for tech staffing/outsourcing companies.

## Features

### Core Modules
- **Customers** - Manage client relationships with contacts, notes, and project history
- **Projects** - Track projects with detailed requirements, status pipeline, and team assignments
- **Candidates** - Talent pool management with resumes, interview notes, and skill tracking
- **Matching Engine** - Automated candidate matching based on project requirements

### Key Capabilities
- **RBAC (Role-Based Access Control)** - 4 distinct roles with granular permissions
- **Activity Logging** - Track all changes to entities
- **Status Pipelines** - Visual workflow management for projects and candidates
- **Search & Filter** - Quick access to data across all modules

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI primitives

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd naviteq
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Credentials

| Role           | Email                    | Password  |
|----------------|--------------------------|-----------|
| Admin          | admin@naviteq.com        | admin123  |
| Sales          | sarah@naviteq.com        | admin123  |
| Recruiter      | rachel@naviteq.com       | admin123  |
| Client Manager | michael@naviteq.com      | admin123  |

## User Roles & Permissions

### Admin
- Full access to all modules and settings
- Can manage users and roles
- Can delete any entity

### Sales
- Can manage customers and projects
- Limited candidate view (no sensitive info, resumes, or interview notes)
- Can create and edit projects

### Recruiter
- Full access to candidates (including resumes and interview notes)
- Can view projects and manage candidate submissions
- Can update candidate status in project pipeline

### Client Manager
- Read access to assigned customers and projects
- Can view candidates submitted to their projects
- Can provide feedback on candidates
- Can update project status

## Project Structure

```
naviteq/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Demo data seeding
├── src/
│   ├── app/
│   │   ├── (auth)/      # Login pages
│   │   ├── (dashboard)/ # Main app pages
│   │   └── api/         # API routes
│   ├── components/
│   │   ├── forms/       # Form dialogs
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Base UI components
│   ├── lib/
│   │   ├── auth.ts      # Authentication config
│   │   ├── matching.ts  # Matching engine
│   │   ├── permissions.ts # RBAC logic
│   │   ├── prisma.ts    # Database client
│   │   └── validations.ts # Zod schemas
│   └── types/           # TypeScript types
└── public/
    └── uploads/         # Local file storage
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and reseed |

## Entity Models

### Project Pipeline Statuses
1. Initial
2. Sourcing
3. Interviews
4. Closed Won
5. Closed Lost

### Candidate Pipeline Stages (per project)
1. Shortlisted
2. Contacted
3. Submitted to Client
4. Interviewing
5. Rejected
6. Hired

## Matching Engine

The matching engine calculates a 0-100 score based on:
- **Technologies overlap** (40 points)
- **Must-have requirements** (25 points)
- **Seniority alignment** (15 points)
- **Years of experience** (10 points)
- **Nice-to-have bonus** (10 points)

Matching reasons are provided for each candidate.

## Future Enhancements

- File upload for resumes (S3 integration)
- SSO/OAuth authentication
- Email notifications
- Advanced reporting/analytics
- Calendar integration
- Mobile responsive improvements
- Export functionality (PDF, CSV)
- Embeddings-based semantic matching

## Assumptions Made

1. **Authentication**: Email/password based for MVP (SSO can be added later)
2. **File Storage**: Local storage for dev mode (S3-compatible for production)
3. **Resume Text**: Manual paste for MVP (OCR/parsing can be added)
4. **Notifications**: Not implemented in MVP
5. **Multi-language**: English UI only

## License

Private - Naviteq Internal Use Only
