# NexSupply

Sourcing Intelligence OS for US SMB Retailers.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (SSR)
- **AI:** Gemini 1.5 Flash

## Architecture

The project strictly separates **Product** (Knowledge) and **Order** (Transaction) domains:

- **Products:** Product knowledge, image analysis, supplier matching, and sourcing intelligence
- **Orders:** Purchase order management and transaction tracking

## Design System

- **Style:** Apple-style Minimalist
- **Colors:** Slate Gray, Electric Blue
- **Border Radius:** Rounded-3xl (1.5rem)
- **UI Pattern:** Actionable Cards over dense tables

## Intelligence Pipeline

1. **Image Analysis** (Gemini 1.5 Flash)
   - Product name extraction
   - Description generation
   - Category classification
   - Attribute extraction
   - Keyword generation

2. **Supplier Matching** (ImportKey/Supabase Cache)
   - Product name similarity matching
   - Category-based filtering
   - Keyword matching
   - Match score calculation (0-100)

3. **Landed Cost Calculation**
   - Formula: `Unit * (1+Duty) + Shipping + Fee`
   - Per-unit cost breakdown
   - Total landed cost calculation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- Google Gemini API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── products/          # Product (Knowledge) domain
│   ├── orders/            # Order (Transaction) domain
│   └── layout.tsx         # Root layout
├── types/                  # TypeScript interfaces
│   └── index.ts           # Shared type definitions
└── utils/
    ├── supabase/          # Supabase client utilities
    │   ├── server.ts      # Server-side Supabase client
    │   └── client.ts      # Client-side Supabase client
    └── intelligence/      # Intelligence Pipeline
        ├── image-analysis.ts
        ├── supplier-matching.ts
        ├── landed-cost.ts
        └── pipeline.ts    # Complete pipeline integration
```

## Coding Principles

- **TypeScript:** Always use interfaces, never use `any` type
- **Data Fetching:** Prefer Server Components
- **Supabase:** Use `@supabase/ssr` package, NOT `auth-helpers`
- **Imports:** Use `@/` alias for all imports
- **Styling:** Use Tailwind CSS utility classes
- **UI Components:** Prioritize "Actionable Cards" over dense tables

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## License

Private project - All rights reserved
