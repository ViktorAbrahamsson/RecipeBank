import { useState } from 'react';
import { loadRecipes, getAllMeals, getAllTypes, getAllTags } from '../utils/loadRecipes';
import { RecipeCard } from '../components/RecipeCard';
import styles from './RecipeListPage.module.scss';

export function RecipeListPage() {
  const recipes = loadRecipes();
  const meals = getAllMeals();
  const types = getAllTypes();
  const tags = getAllTags();

  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = recipes.filter((r) => {
    if (activeMeal && r.meal !== activeMeal) return false;
    if (activeType && r.type !== activeType) return false;
    if (activeTag && !r.tags?.includes(activeTag)) return false;
    return true;
  });

  function FilterRow({
    label,
    options,
    active,
    onToggle,
  }: {
    label: string;
    options: string[];
    active: string | null;
    onToggle: (v: string) => void;
  }) {
    if (options.length === 0) return null;
    return (
      <div className={styles.filterSection}>
        <p className={styles.filterLabel}>{label}</p>
        <div className={styles.tags}>
          {options.map((opt) => (
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
        options={meals}
        active={activeMeal}
        onToggle={(v) => setActiveMeal(activeMeal === v ? null : v)}
      />
      <FilterRow
        label="Rätt"
        options={types}
        active={activeType}
        onToggle={(v) => setActiveType(activeType === v ? null : v)}
      />
      <FilterRow
        label="Ingredienser"
        options={tags}
        active={activeTag}
        onToggle={(v) => setActiveTag(activeTag === v ? null : v)}
      />

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
