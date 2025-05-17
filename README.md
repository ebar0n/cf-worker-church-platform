# El Jordan Seventh-day Adventist Church

This project is the official website for El Jordan Seventh-day Adventist Church (Ibagué, Colombia). It allows members and visitors to:

- Learn about the church, its services, and activities
- Update member information through a secure form
- Request contact, prayer, or visit as a friend/visitor
- Check contact information, schedules, and location
- View the church's Instagram feed

## System Design

The visual design and user experience follow the official Seventh-day Adventist Church global guidelines: [adventist.design](https://www.adventist.design/). We use their colors, typography (Advent Sans/Advent Pro), iconography, and accessibility principles to maintain global consistency and professionalism.

## Project Architecture

- **Frontend:** Next.js (React) with TailwindCSS for styles and components
- **Backend/API:** API endpoints in `/api` to handle forms and data
- **Database:** Cloudflare D1 (SQLite serverless) managed with Prisma ORM
- **Deployment:** Cloudflare Workers for high availability and scalability
- **Componentization:** All main site sections are reusable and decoupled components

## Project Structure

```
cf-worker-church-platform/
├── src/
│   ├── app/           # Next.js app directory
│   ├── lib/           # Utility functions and shared logic
│   ├── prisma/        # Prisma client and database utilities
│   ├── types/         # TypeScript type definitions
│   └── schema.prisma  # Database schema definition
├── migrations/        # SQL migration files
├── public/           # Static assets
└── ...config files
```

### Key Directories

- `src/app/` — Next.js application routes and components
- `src/lib/` — Shared utilities and helper functions
- `src/prisma/` — Database-related code and Prisma client
- `src/types/` — TypeScript type definitions
- `migrations/` — SQL migration files for database schema changes
- `public/` — Static assets (images, fonts, etc.)

## Developer Commands

### Install dependencies

```bash
nvm use
make env
yarn install
```

### Generate Types

```bash
yarn cf:typegen
```

### Generate Prisma client

```bash
yarn db:generate
```

### Database Management

- **Apply migrations locally:**
  ```bash
  yarn db:migrate
  ```

### Run the application in development

```bash
yarn dev
```

### Build the application for production

```bash
yarn build
```

### Deploy to Cloudflare Workers

```bash
yarn deploy
```

### Additional Commands

- **Format code:**

  ```bash
  yarn format
  ```

- **Generate Cloudflare types:**
  ```bash
  yarn cf:typegen
  ```

## Environment Variables

For local development, you can copy `.dev.vars.example` to `.dev.vars` and update the values.

## Notes on Cloudflare D1 and Prisma

- Prisma is used in SQLite mode for D1 compatibility
- Migrations are stored in the `migrations/` directory as SQL files
- The database schema is defined in `src/schema.prisma`
- For production, configure your D1 database in Cloudflare and update the environment variable

## Configuration Files

- `wrangler.jsonc` — Cloudflare Workers configuration
- `next.config.ts` — Next.js configuration
- `tailwind.config.ts` — Tailwind CSS configuration
- `tsconfig.json` — TypeScript configuration
- `.eslintrc.json` — ESLint configuration
- `.prettierrc` — Prettier configuration

## Credits and License

- Visual design based on [adventist.design](https://www.adventist.design/)
- Advent Sans/Advent Pro typography under SIL Open Font License
- Code under MIT license

---

Questions or suggestions? Contact us or open an issue!
