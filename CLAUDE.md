# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install        # install dependencies
pnpm dev            # start dev server at localhost:5173
pnpm build          # type-check + build to dist/
pnpm preview        # serve the dist/ build locally
```

## Environment

Requires `.env.local` in the project root:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

The dev machine runs **Node 16** — Vite 4 is intentionally kept (Vite 5 requires Node 18). GitHub Actions CI uses Node 20, so builds are fine.

## Stack

- **Vite 4** + **React 18** + **TypeScript**
- **@supabase/supabase-js** — runtime data fetching and auth
- **SCSS** via `sass` — CSS Modules for component styles (`*.module.scss`)
- **React Router v6** with `BrowserRouter` — clean URLs via 404 redirect trick; `CNAME` points GitHub Pages to `receptvalvet.se`
- **react-markdown** + **remark-gfm** — renders markdown recipe bodies in detail page and admin preview
- **js-yaml** — only used in `scripts/migrate-recipes.js` (dev/migration only, not in the app bundle)

## Architecture

### Recipe pipeline

Recipes are stored in a **Supabase Postgres database** and fetched at runtime — there are no longer build-time markdown files driving the UI.

```
Supabase DB (recipes table)  →  src/utils/loadRecipes.ts  →  pages
```

`src/utils/supabaseClient.ts` exports a single Supabase client instance. `loadRecipes.ts` exposes async functions that query the `recipes` table. Results are cached in a module-level variable; call `clearRecipeCache()` after any mutation.

**Key utility functions (all async):**
- `loadRecipes(): Promise<Recipe[]>` — full list, ordered by `created_at DESC`
- `getRecipeBySlug(slug): Promise<Recipe | null>` — single recipe, bypasses cache
- `clearRecipeCache()` — invalidates cache after create/edit/delete

**Image URLs:** Recipe images are stored in the Supabase Storage bucket `recipe-images`. Use `recipeImageUrl(filename)` from `src/utils/imageUrl.ts` — never construct image URLs manually.

### Recipe data model (`src/types/recipe.ts`)

```ts
interface RecipeMeta {
  title: string;
  meal?: string;       // Frukost | Lunch | Middag | Efterrätt | Fika | Tillbehör | Snack
  type?: string;       // Soppa | Gryta | Sallad | Wrap | Smörgås | Dryck | Bakverk | Tårta | Kakor | Gröt | Sås
  servings: number;
  prep_time: string;   // e.g. "30 min", "1 h 15 min"
  author?: string;
  description?: string;
  image?: string;      // filename in Supabase Storage bucket "recipe-images"
  source?: string;     // URL
  tags?: string[];
}
interface Recipe extends RecipeMeta { slug: string; content: string; }
```

The database also has `id` (uuid), `created_at`, and `updated_at` columns not in the TypeScript type.

### Admin panel

A protected `/admin` route lets the owner manage recipes without touching code.

- `/admin/login` — email/password login (Supabase Auth)
- `/admin` — recipe list with edit/delete actions
- `/admin/nytt` — create new recipe
- `/admin/redigera/:slug` — edit existing recipe

**Auth:** `src/components/AuthGuard.tsx` wraps the admin routes and redirects to `/admin/login` if no active Supabase session.

**Saving recipes — important:** Use `.insert()` for new recipes and `.update().eq('slug', slug)` for edits. Do NOT use `.upsert()` — it silently fails to update existing rows in this setup.

**Clearing optional fields:** Send `null` (not `undefined`) for optional fields that the user has cleared. `undefined` is omitted from JSON and Supabase won't update the column.

### Theming (dark / light mode)

Colors are defined as CSS custom properties in `src/styles/variables.scss` under `:root` (light) and `[data-theme='dark']` (dark). SCSS variables are aliases to `var(--color-*)`. The active theme is stored in `localStorage` and applied to `<html data-theme>` before React renders (in `main.tsx`) to prevent flash. Default is dark mode. `ThemeToggle` component in `src/components/ThemeToggle.tsx` handles switching.

### CSS class naming

CSS Modules with `generateScopedName: '[local]'` (no hash) — configured in `vite.config.ts`. All class names follow BEM: `block__element--modifier`. Bracket notation required for names with dashes (e.g. `styles['filter__pill--active']`).

### Search & filtering

`RecipeListPage` has live free-text search (matches title, tags, type, meal) and three filter dropdowns (Måltid / Typ / Ingredienser). Filters are smart — only options yielding results with other active filters are shown. All filter state is derived from the loaded `recipes` array via `useMemo`.

### Routing

- `/` → `RecipeListPage` — responsive card grid with search/filter
- `/recept/:slug` → `RecipeDetailPage` — full rendered recipe with JSON-LD schema
- `/admin/login` → `LoginPage`
- `/admin` → `RecipeListAdminPage` (auth-protected)
- `/admin/nytt` → `RecipeFormPage` — create
- `/admin/redigera/:slug` → `RecipeFormPage` — edit

### SCSS structure

- `src/styles/variables.scss` — design tokens (colors, fonts, spacing); import with `@use '../styles/variables' as *`
- `src/styles/main.scss` — global reset and base styles, imported once in `main.tsx`
- Component styles live next to the component as `*.module.scss`

### Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Node 20 + pnpm 8 and deploys `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`. The build step reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **GitHub Actions Variables** (not Secrets — these are public values safe to expose). The custom domain `receptvalvet.se` is declared in `public/CNAME`. Vite `base` is `'/'`.

A second workflow `.github/workflows/keep-supabase-active.yml` pings the Supabase API every Monday to prevent the free-tier project from pausing due to inactivity.

### Key files

| File | Purpose |
|------|---------|
| `src/utils/supabaseClient.ts` | Supabase client singleton |
| `src/utils/loadRecipes.ts` | Async recipe fetching + cache |
| `src/utils/imageUrl.ts` | Supabase Storage image URL helper |
| `src/types/recipe.ts` | `RecipeMeta` and `Recipe` interfaces |
| `src/components/AuthGuard.tsx` | Protects `/admin` routes |
| `src/components/admin/RecipeForm.tsx` | Controlled recipe form with markdown preview |
| `src/components/admin/ImageUpload.tsx` | Image upload to Supabase Storage |
| `src/pages/admin/LoginPage.tsx` | Admin login |
| `src/pages/admin/RecipeListAdminPage.tsx` | Admin recipe list |
| `src/pages/admin/RecipeFormPage.tsx` | Create/edit recipe page |
| `scripts/migrate-recipes.js` | One-off migration from markdown files (already run) |
