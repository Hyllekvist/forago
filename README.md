# Forago

International, SEO-first, privacy-first foraging community.  
Stack: **Next.js 14 (App Router) + TypeScript + Supabase**. Deploy on **Vercel**.

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Supabase

1. Create a Supabase project
2. Apply migrations from `supabase/migrations/`
3. Set env vars in `.env.local` (see `.env.example`)

## Notes

- Locale-first routing: `/dk`, `/en`, ...
- SEO: metadata helpers + JSON-LD components + sitemap/robots routes
- Geo privacy: store **coarse grid cell id** (no exact coordinates)
