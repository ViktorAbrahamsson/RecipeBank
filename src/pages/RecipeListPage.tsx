import { useState } from 'react';
import { loadRecipes, getAllMeals, getAllTypes, getAllTags } from '../utils/loadRecipes';
import { RecipeCard } from '../components/RecipeCard';
import styles from './RecipeListPage.module.scss';

export function RecipeListPage() {
  const recipes = loadRecipes();
  const allMeals = getAllMeals();
  const allTypes = getAllTypes();
  const allTags = getAllTags();

  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const hasActiveFilter = activeMeal !== null || activeType !== null || activeTag !== null;

  const filtered = recipes.filter((r) => {
    if (activeMeal && r.meal !== activeMeal) return false;
    if (activeType && r.type !== activeType) return false;
    if (activeTag && !r.tags?.includes(activeTag)) return false;
    return true;
  });

  const availableMeals = new Set(
    recipes
      .filter((r) => (!activeType || r.type === activeType) && (!activeTag || r.tags?.includes(activeTag)))
      .map((r) => r.meal)
      .filter(Boolean) as string[]
  );
  const availableTypes = new Set(
    recipes
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeTag || r.tags?.includes(activeTag)))
      .map((r) => r.type)
      .filter(Boolean) as string[]
  );
  const availableTags = new Set(
    recipes
      .filter((r) => (!activeMeal || r.meal === activeMeal) && (!activeType || r.type === activeType))
      .flatMap((r) => r.tags ?? [])
  );

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
      </header>

      <section aria-label="Filtrera recept" className={styles['recipes__filters']}>
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
        {hasActiveFilter && (
          <button
            className={styles['filter__clear']}
            onClick={() => { setActiveMeal(null); setActiveType(null); setActiveTag(null); }}
          >
            Rensa filtrering
          </button>
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
