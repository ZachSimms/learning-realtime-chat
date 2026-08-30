# Realtime Chat

A realtime chat application built with **Next.js 16** (App Router, React 19). Users sign in with WorkOS AuthKit, create public or invite-only chat rooms, and chat in realtime with presence and live cursors powered by Ably. Room and membership data is stored in Neon Postgres via Drizzle ORM.

## Features

- **Authentication** — WorkOS AuthKit with middleware-protected routes.
- **Rooms** — create public rooms (auto-join on visit) or private, invite-only rooms.
- **Membership management** — owners can invite users by email, remove members, toggle visibility, and delete rooms.
- **Realtime chat** — per-room channels via `@ably/chat`, with history and presence.
- **Collaboration** — Ably Spaces for participant avatars and live cursors.
- **Scoped tokens** — the Ably token endpoint grants capabilities only for rooms the caller is a member of.

## Tech stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19        |
| Auth           | WorkOS AuthKit (`@workos-inc/authkit-nextjs`) |
| Database       | Neon Postgres + Drizzle ORM              |
| Realtime       | Ably (`@ably/chat`, `@ably/spaces`)      |
| UI             | shadcn/ui, Radix, Tailwind CSS v4        |
| State / data   | React Server Components + server actions, Ably React hooks |
| Package manager| pnpm                                     |

## Project structure

```
.
├── apps/
│   └── frontend/                # the Next.js application
│       ├── app/
│       │   ├── (protected)/chat/    # authenticated chat UI, server actions, room lib
│       │   ├── api/ably/            # scoped Ably token endpoint
│       │   └── auth/                # WorkOS login / callback routes
│       ├── utils/neon/          # Drizzle schema + db client
│       ├── drizzle/             # migrations
│       └── proxy.ts             # AuthKit middleware
├── LICENSE
└── package.json                 # root scripts delegate into apps/frontend
```

## Getting started

### Prerequisites

- Node.js 22+ (Node 24 recommended — the test runner strips TypeScript natively)
- pnpm 11+
- Accounts/keys for [WorkOS](https://workos.com/), [Neon](https://neon.tech/), and [Ably](https://ably.com/)

### Setup

```bash
# 1. Install dependencies
cd apps/frontend
pnpm install

# 2. Configure environment
cp .env.example .env
# then fill in .env with your real keys

# 3. Apply the database schema to your Neon database
pnpm drizzle-kit push   # or: pnpm drizzle-kit migrate
```

See [`apps/frontend/.env.example`](apps/frontend/.env.example) for the full list of required variables (Ably, Neon, and WorkOS keys).

### Commands

Run from the repo root (each delegates into `apps/frontend`):

```bash
pnpm dev      # start the dev server at http://localhost:3000
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint
pnpm test     # run the unit tests (node --test)
```

## Security

- **Secrets** live in `apps/frontend/.env`, which is gitignored. Never commit real keys — use `.env.example` as the template.
- The Ably token endpoint (`app/api/ably/route.ts`) authenticates the caller and grants channel capabilities scoped to that user's room memberships only.
- Server actions validate and authorize every mutation (owner/member checks in `app/(protected)/chat/_actions/actions.ts`).

If you fork or deploy this, rotate any credentials that were ever shared or committed.

## License

[MIT](LICENSE) © Zachary Simms
