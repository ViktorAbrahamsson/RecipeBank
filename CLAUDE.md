# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install        # install dependencies
pnpm dev            # start dev server at localhost:5173
pnpm build          # type-check + build to dist/
pnpm preview        # serve the dist/ build locally
```

## Stack

- **Vite 4** + **React 18** + **TypeScript** — bundler requires Node 16+; upgrade to Node 18 to use Vite 5
- **SCSS** via `sass` — CSS Modules used for component styles (`*.module.scss`)
- **React Router v6** with `BrowserRouter` — clean URLs via 404 redirect trick; `CNAME` file points GitHub Pages to `receptvalvet.se`
- **js-yaml** — parses YAML frontmatter from recipe `.md` files at runtime
- **react-markdown** + **remark-gfm** — renders markdown recipe bodies

## Architecture

### Recipe pipeline
Recipes are `.md` files in `recipes/` at the project root. They are bundled at build time via Vite's `import.meta.glob`:

```
recipes/*.md  →  src/utils/loadRecipes.ts  →  pages
```

`loadRecipes.ts` uses `import.meta.glob('../../recipes/*.md', { as: 'raw', eager: true })` to import all markdown files as strings, then parses each one with a regex splitter + `js-yaml` to extract frontmatter (`RecipeMeta`) and the markdown body (`content`). The filename (minus `.md`) becomes the route slug.

### Theming (dark / light mode)
Colors are defined as CSS custom properties in `src/styles/variables.scss` under `:root` (light) and `[data-theme='dark']` (dark). SCSS variables are aliases to `var(--color-*)` so component files don't need to change when adding dark mode overrides. The active theme is stored in `localStorage` and applied to `<html data-theme>` before React renders (in `main.tsx`) to prevent flash. Default is dark mode. The `ThemeToggle` component (sun/moon button) in `src/components/ThemeToggle.tsx` handles switching on both pages.

### CSS class naming
CSS Modules with `generateScopedName: '[local]'` (no hash) — configured in `vite.config.ts`. All class names follow BEM: `block__element--modifier`. Bracket notation required for names with dashes or double-dash modifiers (e.g. `styles['filter__pill--active']`).

### Search
`RecipeListPage` has a live free-text search that matches against `title`, `tags`, `type`, and `meal`. Works in conjunction with the three filter pill rows (Måltid / Typ / Ingredienser). All grouped in a single panel below the page header.

### Adding a recipe
Create a new file in `recipes/` with this frontmatter structure:

```markdown
---
title: Recipe Title
meal: Middag            # Frukost | Lunch | Middag | Efterrätt | Fika | Tillbehör | Snack
type: Gryta             # Soppa | Gryta | Sallad | Wrap | Smörgås | Dryck | Bakverk | Tårta | Kakor | Gröt | Sås
servings: 4
prep_time: 30 min
description: Optional one-line summary shown on the card.
source: https://example.com/original-recipe  # optional URL shown as "Källa" on the detail page
tags: [köttfärs, lök]   # ingredient-level detail tags
image: filename.jpg     # placed in public/images/recipes/
---

## Ingredients
...

## Instructions
...
```

The recipe appears automatically on the next build — no code changes needed.

### Routing
- `/` → `RecipeListPage` — responsive card grid of all recipes
- `/recipes/:slug` → `RecipeDetailPage` — full rendered recipe

### SCSS structure
- `src/styles/variables.scss` — design tokens (colors, fonts, spacing); import with `@use '../styles/variables' as *`
- `src/styles/main.scss` — global reset and base styles, imported once in `main.tsx`
- Component styles live next to the component as `*.module.scss`

### Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Node 20 + pnpm 8 and deploys `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`. GitHub Pages must be configured to serve from the `gh-pages` branch. The custom domain `receptvalvet.se` is declared in `public/CNAME`. Vite `base` is `'/'`.
