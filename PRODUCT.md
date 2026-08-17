# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal staff of a generator/power-equipment rental business, operating through role-based accounts: owner, engineer (maintenance), accountant, warehouse keeper, rental manager, and support agent. Each role does a distinct daily job inside the same system — engineers work maintenance jobs, accountants handle invoicing, warehouse keepers track equipment inventory, rental managers run rentals and customers, support agents work tickets, and the owner oversees everything via RBAC.

## Product Purpose

A full-stack ERP for a generator/power-equipment rental operation, covering equipment inventory, rentals and customers, maintenance jobs, accounting/invoicing, HR (employees, attendance, payroll), support tickets, notifications, and role-based access control in one coherent system. Built as a portfolio/demo project to demonstrate end-to-end full-stack ERP capability — not tied to a real operating business.

## Positioning

Its differentiator is breadth with coherence: equipment, rentals, maintenance, accounting, and HR share one RBAC model and data model rather than existing as disconnected tools, and the whole system is Arabic-first/RTL rather than translated after the fact.

## Operating Context

- RTL, Arabic-only interface throughout; no localization/language switch planned.
- Roles: owner, engineer, accountant, warehouse_keeper, rental_manager, support_agent (per `Role.key`), extensible via RBAC (`Role`/`Permission`/`UserRole`).
- Core workflows: equipment inventory tracking; rental creation and customer management; maintenance job assignment and completion by engineers; accounting/invoicing (including printable invoices); HR attendance and payroll; support ticket handling with comments and assignment; in-app notifications (including a streaming endpoint); audit logging of actions.
- A background worker (`worker:alerts`) evaluates alerts outside the request cycle.
- Includes a Remotion-based generated product tour video (narration + render pipeline).

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Prisma 7 with driver adapters (`@prisma/adapter-pg`) over PostgreSQL.
- UI built on shadcn using Base UI (`@base-ui/react`), not Radix — see [[feedback_nextjs16_gotchas]].
- Session-based auth with Argon2 password hashing (`@node-rs/argon2`); demo login `owner` / `ChangeMe123!`.
- Tailwind CSS 4, `next-themes` for theming, `motion` for animation.
- Single-tenant demo deployment, not multi-tenant.
- An existing (non-Impeccable) design-system doc lives at `design-system/erp-manufacturing/MASTER.md` — a dense analytics-dashboard palette (blue/amber) and Fira Code/Fira Sans typography. Treated as incumbent visual evidence, not yet ported to a DESIGN.md.

## Brand Commitments

None confirmed. No real business name, logo, or identity beyond the working project name "erp-system"; `public/` only contains default Next.js placeholder assets.

## Evidence on Hand

No real customers, testimonials, press, or business data — only demo/seed data (`prisma/seed.ts`, `prisma/seed-demo.ts`). As a portfolio/demo project, future work must not fabricate real customer names, testimonials, benchmarks, or business claims.

## Product Principles

1. Arabic-first, RTL throughout — never treat localization as an afterthought or bolt-on.
2. Operational density over marketing polish — this is an Operate-mode tool (task completion, scanability, role-specific views), not a persuasion surface.
3. Full module coherence — equipment, rentals, maintenance, accounting, HR, and support share one RBAC and data model; new features should reinforce that shared foundation rather than fork it.
4. Demo integrity — as a portfolio project, avoid fabricated real-world claims; demo data should read as clearly illustrative.
