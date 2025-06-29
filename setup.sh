#!/bin/bash

# Magic Manager - Improved Setup Script

echo "🎴 Setting up Magic Manager..."

# Create project directory if it doesn't exist
if [ ! -d "magic-manager" ]; then
    mkdir magic-manager
    cd magic-manager
else
    cd magic-manager
fi

# Initialize package.json for the workspace
cat > package.json << 'EOF'
{
  "name": "magic-manager",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "clean": "turbo clean",
    "db:generate": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > packages/database/src/types.ts"
  },
  "devDependencies": {
    "@turbo/gen": "^1.10.12",
    "turbo": "^1.10.12",
    "prettier": "^3.0.0",
    "supabase": "^1.110.0"
  },
  "packageManager": "npm@8.19.2",
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ]
}
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# Create directory structure
mkdir -p apps/web
mkdir -p packages/ui packages/database packages/shared
mkdir -p services/api
mkdir -p supabase/migrations

echo "📁 Created project structure"

# Check if turbo is available, install locally if not (avoid global install permission issues)
if ! command -v turbo &> /dev/null; then
    echo "📦 Installing Turbo locally..."
    npm install
else
    echo "✅ Turbo already available"
    npm install
fi

echo "🚀 Installing Next.js..."

# Create Next.js app with --skip-install to avoid conflicts
cd apps/web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --skip-install --no-turbopack

# Go back to root
cd ../..

echo "📦 Installing dependencies..."

# Install all required dependencies with correct versions and compatibility flags
echo "Installing core dependencies..."
npm install -w apps/web @supabase/ssr@^0.5.2  # Updated package (replaces deprecated auth-helpers)
npm install -w apps/web zod@^3.22.4
npm install -w apps/web swr@^2.2.4
npm install -w apps/web @tanstack/react-virtual@^3.0.0
npm install -w apps/web next-themes@^0.2.1

echo "Installing UI components..."
# Install Radix UI components with legacy peer deps to handle React 19
npm install -w apps/web @radix-ui/react-dropdown-menu@^2.0.6 --legacy-peer-deps
npm install -w apps/web @radix-ui/react-label@^2.0.2 --legacy-peer-deps
npm install -w apps/web @radix-ui/react-slot@^1.0.2 --legacy-peer-deps
npm install -w apps/web @radix-ui/react-tabs@^1.0.4 --legacy-peer-deps
npm install -w apps/web @radix-ui/react-toast@^1.1.5 --legacy-peer-deps

echo "Installing utility libraries..."
npm install -w apps/web class-variance-authority@^0.7.0
npm install -w apps/web clsx@^2.0.0
npm install -w apps/web tailwind-merge@^2.1.0
npm install -w apps/web lucide-react@^0.460.0 --legacy-peer-deps  # Updated version with React 19 support
npm install -w apps/web tailwindcss-animate

echo "🎨 Setting up shadcn/ui..."

# Initialize shadcn/ui with updated command
cd apps/web
npx shadcn@latest init --yes --defaults

# Add required components
echo "Adding shadcn/ui components..."
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add toast
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add switch
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add command

cd ../..

# Create environment file
cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_ID=your_supabase_project_id

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Development
NODE_ENV=development
EOF

# Create .env.local from example
cp .env.example .env.local

echo "🔧 Creating project files..."

# Create a basic README
cat > README.md << 'EOF'
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
EOF

echo "✅ Setup complete!"
echo ""
echo "🚨 Important Notes:"
echo "• Some packages installed with --legacy-peer-deps for React 19 compatibility"
echo "• Updated to @supabase/ssr (replaces deprecated auth-helpers)"
echo "• Updated lucide-react to version with React 19 support"
echo "• Avoided global turbo installation to prevent permission issues"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Run the database schema in your Supabase project"
echo "3. Create user accounts in Supabase Auth"
echo "4. Run 'npm run dev' to start development"
echo ""
echo "🎴 Happy coding with Magic Manager!"