import { useState, useEffect } from 'react';
import { loadRecipes, getAllMeals, getAllTypes, getAllTags } from '../utils/loadRecipes';
import { RecipeCard } from '../components/RecipeCard';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './RecipeListPage.module.scss';

const PAGE_SIZE = 9;

export function RecipeListPage() {
  const recipes = loadRecipes();
  const allMeals = getAllMeals();
  const allTypes = getAllTypes();
  const allTags = getAllTags();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const q = searchQuery.toLowerCase().trim();
  const hasActiveFilter = q !== '' || activeMeal !== null || activeType !== null || activeTag !== null;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeMeal, activeType, activeTag]);

  const filtered = recipes.filter((r) => {
    if (activeMeal && r.meal !== activeMeal) return false;
    if (activeType && r.type !== activeType) return false;
    if (activeTag && !r.tags?.includes(activeTag)) return false;
    if (q) {
      const inTitle = r.title.toLowerCase().includes(q);
      const inTags = r.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
      const inType = r.type?.toLowerCase().includes(q) ?? false;
      const inMeal = r.meal?.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inTags && !inType && !inMeal) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const searchFiltered = q
    ? recipes.filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inTags = r.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const inType = r.type?.toLowerCase().includes(q) ?? false;
        const inMeal = r.meal?.toLowerCase().includes(q) ?? false;
        return inTitle || inTags || inType || inMeal;
      })
    : recipes;

  const availableMeals = new Set(
    searchFiltered
      .filter((r) => (!activeType || r.type === activeType) && (!activeTag || r.tags?.includes(activeTag)))
      .map((r) => r.meal).filter(Boolean) as string[]
  );
  const availableTypes = new Set(
    searchFiltered
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeTag || r.tags?.includes(activeTag)))
      .map((r) => r.type).filter(Boolean) as string[]
  );
  const availableTags = new Set(
    searchFiltered
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeType || r.type === activeType))
      .flatMap((r) => r.tags ?? [])
  );

  function clearAll() {
    setSearchQuery('');
    setActiveMeal(null);
    setActiveType(null);
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
    <main className={styles.recipes}>
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
            id="filter-typ"
            label="Typ"
            defaultLabel="Typ"
            options={allTypes}
            available={availableTypes}
            value={activeType}
            onChange={setActiveType}
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
        {filtered.length === 0 ? (
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
                >←</button>
                <span className={styles['recipes__pagination-info']}>{page} / {totalPages}</span>
                <button
                  className={styles['recipes__pagination-btn']}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={page === totalPages}
                  aria-label="Nästa sida"
                >→</button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
