import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRecipeBySlug, clearRecipeCache } from '../../utils/loadRecipes';
import { supabase } from '../../utils/supabaseClient';
import { Recipe } from '../../types/recipe';
import { RecipeForm } from '../../components/admin/RecipeForm';
import styles from './RecipeFormPage.module.scss';

export function RecipeFormPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEdit = !!slug;

  const [initial, setInitial] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getRecipeBySlug(slug).then((r) => {
      setInitial(r);
      setLoading(false);
    });
  }, [slug]);

  async function handleSave(data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    setSaving(true);
    const { error } = isEdit
      ? await supabase.from('recipes').update(data).eq('slug', slug!)
      : await supabase.from('recipes').insert(data);
    setSaving(false);
    if (error) {
      if (error.code === '23505') return 'En slug med detta namn finns redan.';
      return 'Kunde inte spara receptet.';
    }
    clearRecipeCache();
    navigate('/admin');
    return null;
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <p>Laddar…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles['page__header']}>
        <Link to="/admin" className={styles['page__back']}>← Tillbaka</Link>
        <h1 className={styles['page__title']}>{isEdit ? 'Redigera recept' : 'Nytt recept'}</h1>
      </header>
      <RecipeForm initial={initial ?? undefined} onSave={handleSave} saving={saving} />
    </main>
  );
}
