import { useState, useEffect, useMemo } from 'react';
import { loadRecipes } from '../utils/loadRecipes';
import { Recipe } from '../types/recipe';
import { RecipeCard } from '../components/RecipeCard';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './RecipeListPage.module.scss';

const PAGE_SIZE = 9;

type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'prep_asc' | 'prep_desc';

function parsePrepTime(prep: string): number {
  const h = prep.match(/(\d+)\s*h/);
  const m = prep.match(/(\d+)\s*min/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

function RecipeCardSkeleton({ index }: { index: number }) {
  const delay = `${index * 0.07}s`;
  const lineStyle = { animationDelay: delay };
  return (
    <div className={styles['skeleton__card']} aria-hidden="true" style={{ animationDelay: delay }}>
      <div className={styles['skeleton__image']} style={lineStyle} />
      <div className={styles['skeleton__body']}>
        <div className={`${styles['skeleton__line']} ${styles['skeleton__line--short']}`} style={lineStyle} />
        <div className={`${styles['skeleton__line']} ${styles['skeleton__line--title']}`} style={lineStyle} />
        <div className={styles['skeleton__meta']}>
          <div className={`${styles['skeleton__line']} ${styles['skeleton__line--meta']}`} style={lineStyle} />
          <div className={`${styles['skeleton__line']} ${styles['skeleton__line--meta']}`} style={lineStyle} />
        </div>
        <div className={styles['skeleton__line']} style={lineStyle} />
        <div className={`${styles['skeleton__line']} ${styles['skeleton__line--medium']}`} style={lineStyle} />
      </div>
    </div>
  );
}

export function RecipeListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    document.title = 'Receptvalvet – Familjens receptsamling';
  }, []);

  useEffect(() => {
    loadRecipes()
      .then(setRecipes)
      .catch(() => setError('Kunde inte ladda recept.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeMeal, activeTag, sortBy]);

  const MEAL_ORDER = ['Frukost', 'Lunch', 'Tillbehör', 'Fika', 'Kvällsmat', 'Efterrätt', 'Snack'];
  const allMeals = useMemo(() => {
    const meals = recipes.flatMap((r) => r.meal ?? []);
    const unique = [...new Set(meals)];
    return unique.sort((a, b) => {
      const ai = MEAL_ORDER.indexOf(a);
      const bi = MEAL_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [recipes]);

  const allTags = useMemo(() => {
    const tags = recipes.flatMap((r) => r.tags ?? []).map((t) => t.toLowerCase());
    return [...new Set(tags)].sort((a, b) => a.localeCompare(b, 'sv'));
  }, [recipes]);

  const q = searchQuery.toLowerCase().trim();
  const hasActiveFilter = q !== '' || activeMeal !== null || activeTag !== null;

  const filtered = recipes.filter((r) => {
    if (activeMeal && !r.meal?.includes(activeMeal)) return false;
    if (activeTag && !r.tags?.map((t) => t.toLowerCase()).includes(activeTag)) return false;
    if (q) {
      const inTitle = r.title.toLowerCase().includes(q);
      const inTags = r.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
      const inMeal = r.meal?.some((m) => m.toLowerCase().includes(q)) ?? false;
      const inAuthor = r.author?.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inTags && !inMeal && !inAuthor) return false;
    }
    return true;
  });

  const sorted: Recipe[] =
    sortBy === 'oldest' ? [...filtered].reverse() :
    sortBy === 'title_asc' ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'sv')) :
    sortBy === 'title_desc' ? [...filtered].sort((a, b) => b.title.localeCompare(a.title, 'sv')) :
    sortBy === 'prep_asc' ? [...filtered].sort((a, b) => parsePrepTime(a.prep_time) - parsePrepTime(b.prep_time)) :
    sortBy === 'prep_desc' ? [...filtered].sort((a, b) => parsePrepTime(b.prep_time) - parsePrepTime(a.prep_time)) :
    filtered;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const searchFiltered = q
    ? recipes.filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inTags = r.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const inMeal = r.meal?.some((m) => m.toLowerCase().includes(q)) ?? false;
        const inAuthor = r.author?.toLowerCase().includes(q) ?? false;
        return inTitle || inTags || inMeal || inAuthor;
      })
    : recipes;

  const availableMeals = new Set(
    searchFiltered
      .filter((r) => !activeTag || r.tags?.includes(activeTag))
      .flatMap((r) => r.meal ?? [])
  );
  const availableTags = new Set(
    searchFiltered
      .filter((r) => !activeMeal || r.meal?.includes(activeMeal))
      .flatMap((r) => r.tags?.map((t) => t.toLowerCase()) ?? [])
  );

  function clearAll() {
    setSearchQuery('');
    setActiveMeal(null);
    setActiveTag(null);
  }

  function FilterSelect({
    id, label, defaultLabel, options, available, value, onChange,
  }: {
    id: string;
    label: string;
    defaultLabel: string;
    options: string[];
    available: Set<string>;
    value: string | null;
    onChange: (v: string | null) => void;
  }) {
    const visible = options.filter((o) => available.has(o));
    if (visible.length === 0) return null;
    return (
      <div className={styles['toolbar__select-wrapper']}>
        <label htmlFor={id} className="sr-only">{label}</label>
        <select
          id={id}
          className={`${styles['toolbar__select']} ${value ? styles['toolbar__select--active'] : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">{defaultLabel}</option>
          {visible.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <main id="main-content" className={styles.recipes}>
      <header className={styles['recipes__header']}>
        <h1>Receptvalvet</h1>
        <ThemeToggle />
      </header>

      <section aria-label="Sök och filtrera recept" className={styles['recipes__toolbar']}>
        <search className={styles['toolbar__search']}>
          <label htmlFor="recipe-search" className="sr-only">Sök recept</label>
          <input
            id="recipe-search"
            type="search"
            className={styles['toolbar__search-input']}
            placeholder="Sök på recept…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </search>

        <div className={styles['toolbar__filters']}>
          <div className={styles['toolbar__select-wrapper']}>
            <label htmlFor="sort-by" className="sr-only">Sortera</label>
            <select
              id="sort-by"
              className={`${styles['toolbar__select']} ${sortBy !== 'newest' ? styles['toolbar__select--active'] : ''}`}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="newest">Nyast</option>
              <option value="oldest">Äldst</option>
              <option value="title_asc">Titel A–Ö</option>
              <option value="title_desc">Titel Ö–A</option>
              <option value="prep_asc">Tid: kortast</option>
              <option value="prep_desc">Tid: längst</option>
            </select>
          </div>
          <FilterSelect
            id="filter-maltid"
            label="Måltid"
            defaultLabel="Måltid"
            options={allMeals}
            available={availableMeals}
            value={activeMeal}
            onChange={setActiveMeal}
          />
          <FilterSelect
            id="filter-ingredienser"
            label="Ingredienser"
            defaultLabel="Ingrediens"
            options={allTags}
            available={availableTags}
            value={activeTag}
            onChange={setActiveTag}
          />
          {hasActiveFilter && (
            <button
              className={styles['toolbar__clear']}
              onClick={clearAll}
              aria-label="Rensa alla filter"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      <section aria-label="Recept">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {loading
            ? 'Laddar recept…'
            : filtered.length === 0
              ? 'Inga recept hittades.'
              : `${filtered.length} recept hittade${filtered.length === 1 ? 's' : ''}.`}
        </p>
        {loading ? (
          <ul className={styles['recipes__grid']} aria-hidden="true">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <li key={i}><RecipeCardSkeleton index={i} /></li>
            ))}
          </ul>
        ) : error ? (
          <p className={styles['recipes__empty']}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className={styles['recipes__empty']}>Inga recept hittades.</p>
        ) : (
          <>
            <ul className={styles['recipes__grid']}>
              {paginated.map((recipe) => (
                <li key={recipe.slug}>
                  <RecipeCard recipe={recipe} />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav aria-label="Sidnavigering" className={styles['recipes__pagination']}>
                <button
                  className={styles['recipes__pagination-btn']}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={page === 1}
                  aria-label="Föregående sida"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <span className={styles['recipes__pagination-info']}>{page} / {totalPages}</span>
                <button
                  className={styles['recipes__pagination-btn']}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={page === totalPages}
                  aria-label="Nästa sida"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
