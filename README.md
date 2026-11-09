# GSO Property Management System

A property and asset management system built for a General Services
Office (GSO) to track equipment and assets end to end — acquisition,
assignment to accountable officers, PAR/ICS receipts, maintenance,
disposal, and expiry/warranty alerts, with QR codes for quick lookup.

## What it does

- **Dashboard** — asset counts, alerts, and status at a glance
- **Assets** — the full inventory: category, cost, useful life, warranty,
  service dates, current status, and assigned office
- **Accountable Officers** — the staff assets get issued to, per office
- **Assignments** — who currently holds which asset, and its history
- **PAR / ICS Records** — the official receipts printed when an asset is
  issued, each with a QR code for quick lookup
- **Maintenance** — repair/service history per asset
- **Disposal** — retiring/condemning assets, with approval tracking
- **Alerts** — automatic warnings as assets approach warranty expiry,
  end of useful life, or a scheduled service date
- **Settings** — branding (logo/favicon), and an optional team roster
  shown on the homepage

Two roles — Admin and Staff — with Admin-only actions (deleting
records, managing officers/categories/offices, approving disposal)
enforced at the database level via Supabase Row Level Security, not
just hidden in the UI.

## Stack

Next.js (App Router) + Supabase, deployed on Vercel.

## Running it locally

```bash
npm install
npm run dev
```

Needs a Supabase project wired up via `.env.local` to actually do
anything — see the setup instructions that came with this package.
