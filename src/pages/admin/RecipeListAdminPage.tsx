import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadRecipes, clearRecipeCache } from '../../utils/loadRecipes';
import { supabase } from '../../utils/supabaseClient';
import { Recipe } from '../../types/recipe';
import styles from './RecipeListAdminPage.module.scss';

export function RecipeListAdminPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes().then(setRecipes).finally(() => setLoading(false));
  }, []);

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

      <Link to="/" className={styles['admin__back']}>← Till receptsidan</Link>

      {loading ? (
        <p className={styles['admin__empty']}>Laddar recept…</p>
      ) : recipes.length === 0 ? (
        <p className={styles['admin__empty']}>Inga recept ännu.</p>
      ) : (
        <div className={styles['admin__table-wrapper']}>
          <table className={styles['admin__table']}>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Måltid</th>
                <th>Typ</th>
                <th>Portioner</th>
                <th aria-label="Åtgärder"></th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.slug}>
                  <td className={styles['admin__table-title']}>{recipe.title}</td>
                  <td>{recipe.meal ?? '–'}</td>
                  <td>{recipe.type ?? '–'}</td>
                  <td>{recipe.servings}</td>
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
