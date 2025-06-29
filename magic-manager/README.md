# Magic Manager

A modern web application to manage Magic: The Gathering card collections with AI-powered deck building.

## Quick Start

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. Set up your Supabase database schema
3. Create user accounts in Supabase Auth
4. Run `npm run dev` to start development

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run linting
```

## Tech Stack

- Next.js 14 with React 19
- TypeScript
- Tailwind CSS
- Supabase (Database & Auth)
- shadcn/ui components
- TanStack Virtual (for performance)
- SWR (data fetching)
