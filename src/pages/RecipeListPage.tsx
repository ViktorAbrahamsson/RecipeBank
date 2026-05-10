import { useState } from 'react';
import { loadRecipes, getAllTags } from '../utils/loadRecipes';
import { RecipeCard } from '../components/RecipeCard';
import styles from './RecipeListPage.module.scss';

export function RecipeListPage() {
  const recipes = loadRecipes();
  const tags = getAllTags();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? recipes.filter((r) => r.tags?.includes(activeTag))
    : recipes;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Receptbanken</h1>
        {/* <p>Familjens recept</p> */}
      </header>

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${activeTag === tag ? styles.tagActive : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
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
