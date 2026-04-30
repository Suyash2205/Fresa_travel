# Fresa Partner Referral Portal (MVP)

Separate portal for travel agents and Fresa admins to track referrals, commission accruals, and monthly payout status.

## MVP Features

- Admin/agent role-based login (`next-auth` credentials).
- Admin-created agents.
- Admin traveller list import (`.csv` or `.xlsx`) mapped to an agent.
- First-agent-wins attribution with email OR phone matching.
- Shopify order webhook ingestion and 5% commission calculation on subtotal.
- Monthly statement generation, approval, and mark-paid workflow.
- Agent dashboard with referral conversion and commission details.
- Reconciliation endpoint for unmatched orders.

## Tech Stack

- Next.js App Router
- PostgreSQL + Prisma
- Tailwind CSS
- NextAuth (credentials)

## Setup

1. Install dependencies:
   - `npm install`
2. Configure `.env` values:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `SHOPIFY_WEBHOOK_SECRET`
   - `RECONCILE_TOKEN`
3. Generate and migrate schema:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
4. Seed initial admin:
   - `npm run prisma:seed`
5. Start app:
   - `npm run dev`

## Default Seed Admin

- Email: `admin@fresafoods.in`
- Password: `ChangeMe123!`

Override with:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Core Endpoints

- `POST /api/admin/agents`
- `POST /api/admin/import-travellers`
- `POST /api/shopify/webhooks/orders`
- `POST /api/admin/statements/generate`
- `POST /api/admin/statements/:id/approve`
- `POST /api/admin/statements/:id/mark-paid`
- `POST /api/internal/reconcile`
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
