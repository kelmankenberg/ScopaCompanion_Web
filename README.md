# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# ScopaCompanion_Web

## Supabase Anonymous Cloud Sync

The app supports optional cloud sync for settings, players, saved roster names, and round history.

If Supabase env vars are missing, the app falls back to local-only storage.

### 1. Create Supabase project and enable anonymous auth

- Create a Supabase project.
- In Authentication -> Providers, enable Anonymous sign-ins.

### 2. Add environment variables

Copy .env.example to .env and set:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### 3. Create table and RLS policies

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.scopa_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.scopa_states enable row level security;

create policy "Users can read own state"
on public.scopa_states
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own state"
on public.scopa_states
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own state"
on public.scopa_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### Notes

- Cloud row key uses authenticated anonymous user id: user_id.
- Conflict resolution uses updatedAt timestamp (newer state wins on startup).
- Anonymous identity is browser-profile scoped unless linked to a named account later.
