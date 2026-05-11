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

  // Each dimension's available options are based on the OTHER two active filters.
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
    return (
      <div className={styles.filterSection}>
        <p className={styles.filterLabel}>{label}</p>
        <div className={styles.tags}>
          {visible.map((opt) => (
            <button
              key={opt}
              className={`${styles.tag} ${active === opt ? styles.tagActive : ''}`}
              onClick={() => onToggle(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Receptvalvet</h1>
      </header>

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
          className={styles.clearButton}
          onClick={() => { setActiveMeal(null); setActiveType(null); setActiveTag(null); }}
        >
          Rensa filtrering
        </button>
      )}

      {filtered.length === 0 ? (
        <p className={styles.empty}>Inga recept hittades.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}
