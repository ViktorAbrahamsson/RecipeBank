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
- **React Router v6** with `HashRouter` — required for GitHub Pages (no server-side routing)
- **js-yaml** — parses YAML frontmatter from recipe `.md` files at runtime
- **react-markdown** + **remark-gfm** — renders markdown recipe bodies

## Architecture

### Recipe pipeline
Recipes are `.md` files in `recipes/` at the project root. They are bundled at build time via Vite's `import.meta.glob`:

```
recipes/*.md  →  src/utils/loadRecipes.ts  →  pages
```

`loadRecipes.ts` uses `import.meta.glob('../../recipes/*.md', { as: 'raw', eager: true })` to import all markdown files as strings, then parses each one with a regex splitter + `js-yaml` to extract frontmatter (`RecipeMeta`) and the markdown body (`content`). The filename (minus `.md`) becomes the route slug.

### Adding a recipe
Create a new file in `recipes/` with this frontmatter structure:

```markdown
---
title: Recipe Title
category: Dinner        # used for display and future filtering
servings: 4
prep_time: 30 min
description: Optional one-line summary shown on the card.
---

## Ingredients
...

## Instructions
...
```

The recipe appears automatically on the next build — no code changes needed.

### Routing
- `#/` → `RecipeListPage` — responsive card grid of all recipes
- `#/recipes/:slug` → `RecipeDetailPage` — full rendered recipe

### SCSS structure
- `src/styles/variables.scss` — design tokens (colors, fonts, spacing); import with `@use '../styles/variables' as *`
- `src/styles/main.scss` — global reset and base styles, imported once in `main.tsx`
- Component styles live next to the component as `*.module.scss`

### Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Node 20 + pnpm 8 and deploys `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`. GitHub Pages must be configured to serve from the `gh-pages` branch. The Vite `base` is set to `/RecipeBank/` matching the repository name.
