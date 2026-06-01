import { useState, useEffect, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Recipe } from '../../types/recipe';
import { ImageUpload } from './ImageUpload';
import styles from './RecipeForm.module.scss';

const MEAL_OPTIONS = ['Frukost', 'Lunch', 'Tillbehör', 'Fika', 'Kvällsmat', 'Efterrätt', 'Snack'];

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface FormState {
  slug: string;
  title: string;
  meal: string[];
  servings: string;
  prep_time: string;
  author: string;
  description: string;
  image: string;
  source: string;
  video_url: string;
  tags: string;
  content: string;
}

interface Props {
  initial?: Recipe;
  onSave: (data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<string | null>;
  saving: boolean;
}

export function RecipeForm({ initial, onSave, saving }: Props) {
  const isEdit = !!initial;
  const [slugManual, setSlugManual] = useState(isEdit);
  const [preview, setPreview] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    slug: initial?.slug ?? '',
    title: initial?.title ?? '',
    meal: initial?.meal ?? [],
    servings: initial?.servings != null ? String(initial.servings) : '',
    prep_time: initial?.prep_time ?? '',
    author: initial?.author ?? '',
    description: initial?.description ?? '',
    image: initial?.image ?? '',
    source: initial?.source ?? '',
    video_url: initial?.video_url ?? '',
    tags: initial?.tags?.join(', ') ?? '',
    content: initial?.content ?? '',
  });

  useEffect(() => {
    if (!slugManual) {
      setForm((f) => ({ ...f, slug: toSlug(f.title) }));
    }
  }, [form.title, slugManual]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const err = await onSave({
      slug: form.slug,
      title: form.title,
      meal: form.meal.length > 0 ? form.meal : null,
      servings: parseInt(form.servings, 10),
      prep_time: form.prep_time,
      author: form.author || null,
      description: form.description || null,
      image: form.image || null,
      source: form.source || null,
      video_url: form.video_url || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      content: form.content,
    } as unknown as Omit<Recipe, 'id' | 'created_at' | 'updated_at'>);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles['form__row']}>
        <div className={styles['form__field']}>
          <label htmlFor="rf-title" className={styles['form__label']}>Titel *</label>
          <input
            id="rf-title"
            required
            className={styles['form__input']}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>
        <div className={styles['form__field']}>
          <label htmlFor="rf-slug" className={styles['form__label']}>
            Slug *
            {!isEdit && (
              <span className={styles['form__label-hint']}>
                {slugManual ? '' : ' (auto)'}
              </span>
            )}
          </label>
          <input
            id="rf-slug"
            required
            className={styles['form__input']}
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set('slug', e.target.value); }}
            readOnly={isEdit}
          />
        </div>
      </div>

      <div className={styles['form__row']}>
        <div className={styles['form__field']}>
          <span className={styles['form__label']}>Måltid</span>
          <div className={styles['form__checkboxes']}>
            {MEAL_OPTIONS.map((o) => (
              <label key={o} className={styles['form__checkbox-label']}>
                <input
                  type="checkbox"
                  checked={form.meal.includes(o)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.meal, o]
                      : form.meal.filter((m) => m !== o);
                    setForm((f) => ({ ...f, meal: next }));
                  }}
                />
                {o}
              </label>
            ))}
          </div>
        </div>
        <div className={styles['form__field']}>
          <label htmlFor="rf-servings" className={styles['form__label']}>Portioner *</label>
          <input
            id="rf-servings"
            type="number"
            min={1}
            required
            className={styles['form__input']}
            value={form.servings}
            onChange={(e) => set('servings', e.target.value)}
          />
        </div>
        <div className={styles['form__field']}>
          <label htmlFor="rf-prep" className={styles['form__label']}>Tid *</label>
          <input
            id="rf-prep"
            required
            placeholder="t.ex. 30 min"
            className={styles['form__input']}
            value={form.prep_time}
            onChange={(e) => set('prep_time', e.target.value)}
          />
        </div>
      </div>

      <div className={styles['form__row']}>
        <div className={styles['form__field']}>
          <label htmlFor="rf-author" className={styles['form__label']}>Upphovsman</label>
          <input id="rf-author" className={styles['form__input']} value={form.author} onChange={(e) => set('author', e.target.value)} />
        </div>
        <div className={styles['form__field']}>
          <label htmlFor="rf-source" className={styles['form__label']}>Källa (URL)</label>
          <input id="rf-source" type="url" className={styles['form__input']} value={form.source} onChange={(e) => set('source', e.target.value)} />
        </div>
        <div className={styles['form__field']}>
          <label htmlFor="rf-video" className={styles['form__label']}>Video (URL)</label>
          <input id="rf-video" type="url" className={styles['form__input']} placeholder="t.ex. YouTube eller Instagram" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} />
        </div>
      </div>

      <div className={styles['form__field']}>
        <label htmlFor="rf-desc" className={styles['form__label']}>Beskrivning</label>
        <input id="rf-desc" className={styles['form__input']} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className={styles['form__field']}>
        <label htmlFor="rf-tags" className={styles['form__label']}>Taggar (kommaseparerade)</label>
        <input id="rf-tags" placeholder="t.ex. kyckling, pasta" className={styles['form__input']} value={form.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>

      <div className={styles['form__field']}>
        <label className={styles['form__label']}>Bild</label>
        <ImageUpload currentImage={form.image} onUpload={(filename) => set('image', filename)} />
      </div>

      <div className={styles['form__field']}>
        <div className={styles['form__content-header']}>
          <div className={styles['form__content-label-group']}>
            <label htmlFor="rf-content" className={styles['form__label']}>Innehåll (Markdown) *</label>
            <button
              type="button"
              className={styles['form__tips-btn']}
              onClick={() => setShowTips(true)}
              aria-label="Visa tips för Markdown"
            >
              ?
            </button>
          </div>
          <button type="button" className={styles['form__preview-toggle']} onClick={() => setPreview((p) => !p)}>
            {preview ? 'Redigera' : 'Förhandsgranska'}
          </button>
        </div>

        {showTips && (
          <div className={styles['form__tips-backdrop']} onClick={() => setShowTips(false)}>
            <div className={styles['form__tips-modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['form__tips-header']}>
                <h2 className={styles['form__tips-title']}>Markdown-tips</h2>
                <button
                  type="button"
                  className={styles['form__tips-close']}
                  onClick={() => setShowTips(false)}
                  aria-label="Stäng"
                >
                  ✕
                </button>
              </div>
              <div className={styles['form__tips-body']}>
                <section>
                  <h3>Rekommenderad struktur</h3>
                  <pre>{`## Ingredienser
- 400 g kycklingfilé
- 2 vitlöksklyftor
- 1 msk olivolja
- Salt och peppar

## Gör så här
1. Värm ugnen till 200 °C.
2. Krydda kycklingen med salt och peppar.
3. Stek i ugn 25 min tills genomstekt.`}</pre>
                </section>
                <section>
                  <h3>Formatering</h3>
                  <table>
                    <tbody>
                      <tr><td><code>## Rubrik</code></td><td>Stor rubrik (Ingredienser, Gör så här)</td></tr>
                      <tr><td><code>### Underrubrik</code></td><td>Undergrupp av ingredienser</td></tr>
                      <tr><td><code>- punkt</code></td><td>Punktlista (ingredienser)</td></tr>
                      <tr><td><code>1. steg</code></td><td>Numrerad lista (instruktioner)</td></tr>
                      <tr><td><code>**fet**</code></td><td><strong>Fet text</strong></td></tr>
                      <tr><td><code>*kursiv*</code></td><td><em>Kursiv text</em></td></tr>
                    </tbody>
                  </table>
                </section>
                <section>
                  <h3>Tips</h3>
                  <ul>
                    <li>Lämna en blank rad mellan varje sektion.</li>
                    <li>Skriv mängd före ingrediens: <code>200 g smör</code></li>
                    <li>Använd <strong>Förhandsgranska</strong> för att se resultatet.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}
        {preview ? (
          <div className={styles['form__preview']}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="rf-content"
            required
            className={styles['form__textarea']}
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            rows={18}
          />
        )}
      </div>

      {error && <p className={styles['form__error']} role="alert">{error}</p>}

      <div className={styles['form__actions']}>
        <button type="submit" className={styles['form__btn-save']} disabled={saving}>
          {saving ? 'Sparar…' : 'Spara recept'}
        </button>
      </div>
    </form>
  );
}
