import { useState } from 'react';
import { loadRecipes, getAllMeals, getAllTypes, getAllTags } from '../utils/loadRecipes';
import { RecipeCard } from '../components/RecipeCard';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './RecipeListPage.module.scss';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function RecipeListPage() {
  const recipes = loadRecipes();
  const allMeals = getAllMeals();
  const allTypes = getAllTypes();
  const allTags = getAllTags();

  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const q = searchQuery.toLowerCase().trim();
  const hasActiveFilter = activeMeal !== null || activeType !== null || activeTag !== null;

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
      .map((r) => r.meal)
      .filter(Boolean) as string[]
  );
  const availableTypes = new Set(
    searchFiltered
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeTag || r.tags?.includes(activeTag)))
      .map((r) => r.type)
      .filter(Boolean) as string[]
  );
  const availableTags = new Set(
    searchFiltered
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeType || r.type === activeType))
      .flatMap((r) => r.tags ?? [])
  );

  function clearAll() {
    setActiveMeal(null);
    setActiveType(null);
    setActiveTag(null);
  }

  function FilterRow({
    label,
    options,
    available,
    active,
    onToggle,
  }: {
    label: string;
    options: string[];
    available: Set<string>;
    active: string | null;
    onToggle: (v: string) => void;
  }) {
    const visible = options.filter((o) => available.has(o));
    if (visible.length === 0) return null;
    const headingId = `filter-${label.toLowerCase()}`;
    return (
      <section aria-labelledby={headingId} className={styles.filter}>
        <h2 id={headingId} className={styles['filter__heading']}>{label}</h2>
        <ul className={styles['filter__pills']} role="list">
          {visible.map((opt) => (
            <li key={opt}>
              <button
                className={`${styles['filter__pill']} ${active === opt ? styles['filter__pill--active'] : ''}`}
                aria-pressed={active === opt}
                onClick={() => onToggle(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <main className={styles.recipes}>
      <header className={styles['recipes__header']}>
        <h1>Receptvalvet</h1>
        <ThemeToggle />
      </header>

      <section aria-label="Sök och filtrera recept" className={styles['recipes__panel']}>
        <search className={styles['recipes__search']}>
          <label htmlFor="recipe-search" className="sr-only">Sök recept</label>
          <input
            id="recipe-search"
            type="search"
            className={styles['recipes__search-input']}
            placeholder="Sök på namn, typ eller tagg…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </search>

        <div className={styles['recipes__filter-bar']}>
          <button
            className={styles['recipes__filter-toggle']}
            aria-expanded={filtersOpen}
            aria-controls="recipe-filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            Filtrera
            <ChevronIcon open={filtersOpen} />
          </button>
          {hasActiveFilter && (
            <button className={styles['filter__clear']} onClick={clearAll}>
              Rensa filtrering
            </button>
          )}
        </div>

        {filtersOpen && (
          <div id="recipe-filters">
            <FilterRow
              label="Måltid"
              options={allMeals}
              available={availableMeals}
              active={activeMeal}
              onToggle={(v) => setActiveMeal(activeMeal === v ? null : v)}
            />
            <FilterRow
              label="Typ"
              options={allTypes}
              available={availableTypes}
              active={activeType}
              onToggle={(v) => setActiveType(activeType === v ? null : v)}
            />
            <FilterRow
              label="Ingredienser"
              options={allTags}
              available={availableTags}
              active={activeTag}
              onToggle={(v) => setActiveTag(activeTag === v ? null : v)}
            />
          </div>
        )}
      </section>

      <section aria-label="Recept">
        {filtered.length === 0 ? (
          <p className={styles['recipes__empty']}>Inga recept hittades.</p>
        ) : (
          <ul className={styles['recipes__grid']}>
            {filtered.map((recipe) => (
              <li key={recipe.slug}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
