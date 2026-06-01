import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadRecipes, clearRecipeCache } from '../../utils/loadRecipes';
import { supabase } from '../../utils/supabaseClient';
import { Recipe } from '../../types/recipe';
import styles from './RecipeListAdminPage.module.scss';

type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'prep_asc' | 'prep_desc';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function parsePrepTime(prep: string): number {
  const h = prep.match(/(\d+)\s*h/);
  const m = prep.match(/(\d+)\s*min/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

export function RecipeListAdminPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  useEffect(() => {
    loadRecipes().then(setRecipes).finally(() => setLoading(false));
  }, []);

  const allMeals = useMemo(() => {
    const meals = recipes.flatMap((r) => r.meal ?? []);
    return [...new Set(meals)].sort((a, b) => a.localeCompare(b, 'sv'));
  }, [recipes]);

  const q = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (activeMeal && !r.meal?.includes(activeMeal)) return false;
      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inTags = r.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const inMeal = r.meal?.some((m) => m.toLowerCase().includes(q)) ?? false;
        const inAuthor = r.author?.toLowerCase().includes(q) ?? false;
        if (!inTitle && !inTags && !inMeal && !inAuthor) return false;
      }
      return true;
    });
  }, [recipes, q, activeMeal]);

  const sorted = useMemo((): Recipe[] => {
    if (sortBy === 'oldest') return [...filtered].reverse();
    if (sortBy === 'title_asc') return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'sv'));
    if (sortBy === 'title_desc') return [...filtered].sort((a, b) => b.title.localeCompare(a.title, 'sv'));
    if (sortBy === 'prep_asc') return [...filtered].sort((a, b) => parsePrepTime(a.prep_time) - parsePrepTime(b.prep_time));
    if (sortBy === 'prep_desc') return [...filtered].sort((a, b) => parsePrepTime(b.prep_time) - parsePrepTime(a.prep_time));
    return filtered;
  }, [filtered, sortBy]);

  const hasActiveFilter = q !== '' || activeMeal !== null;

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Ta bort "${title}"? Det går inte att ångra.`)) return;
    setDeletingSlug(slug);
    const { error } = await supabase.from('recipes').delete().eq('slug', slug);
    if (error) {
      alert('Kunde inte ta bort receptet.');
    } else {
      clearRecipeCache();
      setRecipes((prev) => prev.filter((r) => r.slug !== slug));
    }
    setDeletingSlug(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  return (
    <main className={styles.admin}>
      <header className={styles['admin__header']}>
        <h1 className={styles['admin__title']}>Receptvalvet Admin</h1>
        <div className={styles['admin__header-actions']}>
          <Link to="/admin/nytt" className={styles['admin__btn-primary']}>
            + Nytt recept
          </Link>
          <button className={styles['admin__btn-secondary']} onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <Link to="/" className={styles['admin__back']}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{verticalAlign: 'middle', marginBottom: '1px'}}>
          <path d="M8.5 10.5L4 6.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {' '}Till receptsidan
      </Link>

      <div className={styles['admin__toolbar']}>
        <input
          type="search"
          className={styles['admin__search']}
          placeholder="Sök recept…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={styles['admin__toolbar-selects']}>
          <select
            className={styles['admin__select']}
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
          {allMeals.length > 0 && (
            <select
              className={`${styles['admin__select']} ${activeMeal ? styles['admin__select--active'] : ''}`}
              value={activeMeal ?? ''}
              onChange={(e) => setActiveMeal(e.target.value || null)}
            >
              <option value="">Måltid</option>
              {allMeals.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          {hasActiveFilter && (
            <button
              className={styles['admin__toolbar-clear']}
              onClick={() => { setSearchQuery(''); setActiveMeal(null); }}
              aria-label="Rensa filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className={styles['admin__empty']}>Laddar recept…</p>
      ) : recipes.length === 0 ? (
        <p className={styles['admin__empty']}>Inga recept ännu.</p>
      ) : (
        <div className={styles['admin__table-wrapper']}>
          {sorted.length === 0 && (
            <p className={styles['admin__empty']}>Inga recept matchar sökningen.</p>
          )}
          <table className={styles['admin__table']}>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Skapat av</th>
                <th>Senast redigerad</th>
                <th aria-label="Åtgärder"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((recipe) => (
                <tr key={recipe.slug}>
                  <td className={styles['admin__table-title']}>{recipe.title}</td>
                  <td className={styles['admin__table-meta']}>{recipe.created_by ?? '–'}</td>
                  <td className={styles['admin__table-meta']}>{recipe.updated_at ? formatDate(recipe.updated_at) : '–'}</td>
                  <td className={styles['admin__table-actions']}>
                    <Link
                      to={`/admin/redigera/${recipe.slug}`}
                      className={styles['admin__btn-edit']}
                    >
                      Redigera
                    </Link>
                    <button
                      className={styles['admin__btn-delete']}
                      onClick={() => handleDelete(recipe.slug, recipe.title)}
                      disabled={deletingSlug === recipe.slug}
                    >
                      {deletingSlug === recipe.slug ? '…' : 'Ta bort'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
