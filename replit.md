# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/bot run start` — run CYCLOPS Discord bot
- `pnpm --filter @workspace/bot run register` — re-register slash commands manually

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## CYCLOPS Discord Bot (`bot/`)

Pure JavaScript (ESM) Discord bot built with discord.js v14.

**Required secrets:** `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`

**Bot description (set manually in Discord Developer Portal → Bot → Description):**
> **CYCLOPS — Automate Your Tournaments**
>
> An all-in-one esports management bot designed to streamline everything — from moderation to tournament organization.
>
> **Organize like a pro. Elevate your esports experience.**
>
> Reliable. Efficient. Completely free.

**Required Bot intents (enable in Developer Portal):**
- Server Members Intent
- Message Content Intent
- Presence Intent

**Required Bot permissions when inviting:** Administrator (recommended for tournament features).

**Persistent storage:** JSON files in `bot/data/<guildId>.json` (one file per guild).

**Prefix commands (`?`):** ban, kick, mute, unmute, warn, warning, afk, purge, say, stick, stickinfo, lock, unlock, ping, setnick, mc, setup, t, help

**Slash commands (`/`):** modlog, greet, greetdm, gstart, gend, memes, botinfo, nuke, idpdmcaptains, slot-list

**Tournament flow:**
1. Admin runs `?setup` — creates `cyclops-turney-mod` and `idp-access` roles.
2. Admin runs `?t` — opens panel with buttons.
3. Click **Create Channels** — creates a category with all tournament channels (updates, info, rules, roadmap, schedule, how-to-register, tag-check, register-here, confirm-teams, query, point-table, slot-list, help-desk + a slot-manager channel).
4. Click **Create Tournament** — name + slot count + per-team. Multiple tournaments per category.
5. Click **Slot Manager Channel** — deploys the user-facing slot manager UI.
6. Toggle registration with **Start/Pause Registration**.
7. Users register by mentioning their teammates in `register-here`. First mention becomes captain and gets `idp-access` role.
8. Mods use `/idpdmcaptains` to DM Room ID & Password to all captains.
9. Mods use **MS Excel File** to export confirmed teams.
