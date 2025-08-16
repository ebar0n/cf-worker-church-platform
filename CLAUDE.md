# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official website for El Jordan Seventh-day Adventist Church (Ibagué, Colombia). It's a Next.js application deployed on Cloudflare Workers with D1 database, designed following [adventist.design](https://www.adventist.design/) guidelines for visual consistency with the global Adventist Church brand.

## Development Commands

### Initial Setup
```bash
nvm use
make env                    # Sets up yarn 3.6.4 and installs dependencies
yarn cf:typegen            # Generate Cloudflare types
yarn db:generate           # Generate Prisma client
```

### Development Workflow
```bash
yarn dev                   # Start development server with Turbopack
yarn build                 # Production build
yarn format                # Format code with Prettier
```

### Database Management
```bash
yarn db:migrate           # Apply migrations to D1 database
yarn db:generate          # Regenerate Prisma client after schema changes
```

### Cloudflare Deployment
```bash
yarn deploy               # Full build and deploy to Cloudflare Workers
yarn cf:build             # Build for Cloudflare (includes Prisma generation)
yarn cf:deploy            # Deploy only (after cf:build)
yarn preview              # Build and preview locally before deploy
```

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 15.3.2 (App Router) + React 18 + TypeScript
- **Styling:** TailwindCSS v4 with custom Advent typography
- **UI Components:** Radix UI primitives for accessibility
- **Database:** Cloudflare D1 (SQLite) with Prisma ORM
- **Deployment:** Cloudflare Workers via OpenNext.js adapter
- **Forms:** React Hook Form + Zod validation + Turnstile protection

### Database Schema
Core models: `Member`, `FriendRequest`, `Child`, `Program`, `Enrollment`, `Announcement`
- Members have comprehensive church-specific fields (baptism info, ministry preferences)
- Children are linked to members via `ChildGuardian` relationships
- Programs support enrollment with age restrictions
- Announcements are filterable by department (16 different church ministries)

### API Structure
- `/api/admin/*` - Protected admin endpoints for data management
- `/api/member` - Public member registration/updates
- `/api/friend` - Visitor contact requests
- `/api/enrollments` - Program enrollment system
- All endpoints use Zod validation and Turnstile protection

### Component Organization
- `src/app/components/` - Shared UI components (Header, Footer, etc.)
- `src/app/components/ui/` - Reusable Radix-based primitives
- `src/app/admin/components/` - Admin-specific components
- Multi-step forms use separate step components (see `member/components/`)

### Department System
16 church departments defined in `src/lib/constants.ts`:
- Each has name, code, color, and image
- Used throughout app for categorization and filtering
- Includes specialized ministries like Club de Conquistadores, Club de Aventureros

## Development Patterns

### Form Handling
Multi-step forms use React Hook Form with Zod schemas:
```typescript
// Pattern for form steps
const FormStep = ({ onNext, onBack, data, updateData }) => {
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: data
  });
  
  const onSubmit = (values) => {
    updateData(values);
    onNext();
  };
};
```

### Database Queries
Direct D1 queries for performance-critical paths:
```typescript
const result = await env.DB.prepare(`
  SELECT * FROM table WHERE condition = ?
`).bind(value).all();
```

### TypeScript Patterns
- Strict type checking enabled
- Zod schemas for runtime validation
- Prisma generates database types
- Component props fully typed

### Styling Conventions
- TailwindCSS with custom church colors: `#4b207f` (primary purple)
- Advent Pro font family for headings
- Responsive design with mobile-first approach
- Consistent spacing and component sizing

## Church-Specific Context

### Business Logic
- Member lifecycle: Visitor → Friend → Member
- Children require guardian relationships for enrollment
- Programs have department-specific branding and requirements
- Spanish language primary with SDA theological context

### Content Guidelines
- Follow Seventh-day Adventist branding guidelines
- Use inclusive, welcoming language for visitors
- Maintain theological accuracy in content
- Respect privacy for member information

### Deployment Context
- Production domain: `iglesiajordanibague.org`
- D1 database: `church-jordan`
- Environment variables required: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- Static assets served via Cloudflare CDN

## Common Development Tasks

When adding new features:
1. Update database schema in `src/schema.prisma` if needed
2. Create migration in `migrations/` directory
3. Run `yarn db:generate` to update Prisma client
4. Add API routes with Zod validation and Turnstile protection
5. Create components following existing patterns
6. Test locally with `yarn dev` before deploying

When working with forms:
- Always use Zod validation schemas
- Include Turnstile protection for sensitive endpoints
- Follow multi-step pattern for complex forms
- Ensure mobile responsiveness

When working with church departments:
- Use constants from `src/lib/constants.ts`
- Maintain color consistency across features
- Consider multi-department filtering capabilities