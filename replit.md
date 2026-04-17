# Gully Stars

## Overview

**Gully Stars** is a mobile web platform for grassroots sports teams. Equal parts sports management and social. Built for cricket, football, and basketball.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile framework**: Expo (React Native) with Expo Router v6
- **Database**: Supabase (PostgreSQL) — all app data persisted server-side via `@supabase/supabase-js`
- **Image Storage**: Supabase Storage bucket `feed-images` (public, for feed post images)
- **Local storage**: AsyncStorage — only for user identity UUID + onboarding state + followed teams
- **API framework**: Express 5 (shared API server, unused in first build)
- **Build**: esbuild (API server)

## Supabase

- Tables: `users`, `teams`, `feed_posts`, `training_sessions`, `matches`, `tournaments`
- Credentials: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (secrets)
- Client: `artifacts/mobile/lib/supabase.ts` — also exports `uploadImageToStorage()`
- Schema SQL: `artifacts/mobile/supabase-schema.sql` — run in Supabase SQL Editor
- Seed data: auto-seeded on first launch if tables are empty
- RLS: permissive (all operations allowed for anon, identity enforced via UUID in AsyncStorage)

## App Structure

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Redirect: onboarding or main tabs
│   ├── onboarding.tsx       # 3-step onboarding (name → role → sport)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar (NativeTabs / ClassicTabs)
│   │   ├── index.tsx        # Social feed
│   │   ├── teams.tsx        # Team browser + create team
│   │   ├── tournaments.tsx  # Tournaments list + create
│   │   └── profile.tsx      # Player profile + stats
│   ├── team/[id].tsx        # Team detail: squad, training, matches
│   └── tournament/[id].tsx  # Tournament: standings + fixtures
├── components/              # Shared UI components
├── context/AppContext.tsx   # Full app state + actions
└── constants/colors.ts      # Dark charcoal + emerald + gold theme
```

## Features

- **Onboarding**: 3-step role/sport selection (Player, Captain, Organiser, Fan)
- **Social Feed**: Post match results and updates, like posts
- **Team Management**: Create/join public or invite-only teams, roster view
- **Training Sessions**: Schedule sessions, RSVP (Going/Maybe/No), live count
- **Match RSVP**: Schedule matches, confirm attendance, submit scores
- **Tournaments**: Create round-robin/bracket tournaments, standings table, fixtures
- **Player Stats**: Sport-specific stats (cricket: runs/wickets, football: goals/assists, basketball: points/rebounds)
- **Follow Teams**: Follow/unfollow any team

## Sports

Cricket · Football · Basketball

## Color Theme

- Background: `#0A0E13` (dark charcoal)
- Primary: `#00C896` (emerald green)
- Accent: `#FFB800` (gold)
- Sport colors: Cricket `#FF6B35`, Football `#4ECDC4`, Basketball `#FFE66D`

## Key Commands

- `pnpm --filter @workspace/mobile run dev` — run Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm run typecheck` — full typecheck across all packages
