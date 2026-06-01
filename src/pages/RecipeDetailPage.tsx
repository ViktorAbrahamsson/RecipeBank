import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRecipeBySlug } from '../utils/loadRecipes';
import { recipeImageUrl } from '../utils/imageUrl';
import { Recipe } from '../types/recipe';
import { ThemeToggle } from '../components/ThemeToggle';
import { injectTimers } from '../components/TimerButton';
import styles from './RecipeDetailPage.module.scss';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function toPT(s: string): string | undefined {
  const h = s.match(/(\d+)\s*h/i);
  const m = s.match(/(\d+)\s*min/i);
  if (!h && !m) return undefined;
  return 'PT' + (h ? h[1] + 'H' : '') + (m ? m[1] + 'M' : '');
}

const OrderedListCtx = createContext(false);

type StepCtxType = { checkedSteps: Set<number>; toggleStep: (line: number) => void };
const StepCtx = createContext<StepCtxType>({ checkedSteps: new Set(), toggleStep: () => {} });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MdExtraProps = { node?: any; ordered?: boolean };

function StepListItem({ children, node, ordered: _ordered, ...props }: React.ComponentPropsWithoutRef<'li'> & MdExtraProps) {
  const isOrdered = useContext(OrderedListCtx);
  const { checkedSteps, toggleStep } = useContext(StepCtx);

  if (!isOrdered) return <li {...props}>{children}</li>;

  const line: number = node?.position?.start?.line ?? -1;
  const checked = checkedSteps.has(line);

  return (
    <li
      className={`${styles['recipe__step']}${checked ? ` ${styles['recipe__step--checked']}` : ''}`}
      onClick={() => toggleStep(line)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleStep(line);
        }
      }}
    >
      <span className={styles['recipe__step-check']} aria-hidden="true" />
      <span className={styles['recipe__step-text']}>{injectTimers(children, `step-${line}`, checked)}</span>
    </li>
  );
}

const markdownComponents = {
  ol: ({ children, node, ordered: _ordered, ...props }: React.ComponentPropsWithoutRef<'ol'> & MdExtraProps) => (
    <OrderedListCtx.Provider value={true}>
      <ol {...props}>{children}</ol>
    </OrderedListCtx.Provider>
  ),
  ul: ({ children, node, ordered: _ordered, ...props }: React.ComponentPropsWithoutRef<'ul'> & MdExtraProps) => (
    <OrderedListCtx.Provider value={false}>
      <ul {...props}>{children}</ul>
    </OrderedListCtx.Provider>
  ),
  li: StepListItem,
};

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = useCallback((line: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getRecipeBySlug(slug)
      .then(setRecipe)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setCheckedSteps(new Set());
  }, [slug]);

  useEffect(() => {
    document.title = recipe
      ? `${recipe.title} – Receptvalvet`
      : 'Recept hittades inte – Receptvalvet';
  }, [recipe]);

  useEffect(() => {
    if (!recipe) return;
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: recipe.title,
      url: window.location.href,
      ...(recipe.description && { description: recipe.description }),
      ...(recipe.image && { image: [recipeImageUrl(recipe.image)] }),
      ...(recipe.author && { author: { '@type': 'Person', name: recipe.author } }),
      ...(recipe.servings && { recipeYield: String(recipe.servings) }),
      ...(recipe.prep_time && { prepTime: toPT(recipe.prep_time) }),
      ...(recipe.type && { recipeCategory: recipe.type }),
      ...(recipe.tags?.length && { keywords: recipe.tags.join(', ') }),
    };
    const script = document.createElement('script');
    script.id = 'recipe-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.getElementById('recipe-jsonld')?.remove(); };
  }, [recipe]);

  if (loading) {
    return (
      <main id="main-content" className={styles.recipe}>
        <div className={styles['recipe__topbar']}>
          <nav aria-label="Brödsmulor" className={styles['recipe__breadcrumb']}>
            <Link to="/">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{verticalAlign: 'middle', marginBottom: '1px'}}>
              <path d="M8.5 10.5L4 6.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {' '}Alla recept
          </Link>
          </nav>
          <ThemeToggle />
        </div>
        <article>
          <figure className={styles['recipe__hero']}>
            <div className={styles['recipe__hero-placeholder']} aria-hidden="true" />
          </figure>
        </article>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main id="main-content" className={styles.recipe}>
        <p>Receptet hittades inte. <Link to="/">Tillbaka till recept</Link></p>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.recipe}>
      <div className={styles['recipe__topbar']}>
        <nav aria-label="Brödsmulor" className={styles['recipe__breadcrumb']}>
          <Link to="/">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{verticalAlign: 'middle', marginBottom: '1px'}}>
              <path d="M8.5 10.5L4 6.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {' '}Alla recept
          </Link>
        </nav>
        <ThemeToggle />
      </div>

      <article>
        {(!recipe.video_url || recipe.video_url.includes('instagram.com')) && (
          <figure className={styles['recipe__hero']}>
            {recipe.image ? (
              <img
                src={recipeImageUrl(recipe.image)}
                alt={recipe.title}
                className={styles['recipe__hero-image']}
              />
            ) : (
              <div className={styles['recipe__hero-placeholder']} aria-hidden="true" />
            )}
          </figure>
        )}

        {recipe.video_url && !recipe.video_url.includes('instagram.com') && (() => {
          const ytId = extractYouTubeId(recipe.video_url);
          if (ytId) {
            return (
              <div className={styles['recipe__video']}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Video"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            );
          }
          return (
            <p className={styles['recipe__video-link']}>
              <a href={recipe.video_url} target="_blank" rel="noopener noreferrer">
                Se video{' '}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{verticalAlign: 'middle', marginBottom: '1px'}}>
                  <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 1h4m0 0v4m0-4L6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </p>
          );
        })()}

        <header className={styles['recipe__header']}>
          {recipe.meal && recipe.meal.length > 0 && (
            <span className={styles['recipe__category']} aria-label={`Måltidstyp: ${recipe.meal.join(', ')}`}>
              {recipe.meal.join(' · ')}
            </span>
          )}
          <h1>{recipe.title}</h1>
          <ul className={styles['recipe__meta']}>
            <li><span className="sr-only">Portioner: </span>{recipe.servings} portioner</li>
            <li><span className="sr-only">Tillagningstid: </span>{recipe.prep_time}</li>
            {recipe.author && <li><span className="sr-only">Av: </span>{recipe.author}</li>}
          </ul>
          {recipe.description && <p className={styles['recipe__description']}>{recipe.description}</p>}
          {recipe.tags && recipe.tags.length > 0 && (
            <ul className={styles['recipe__tags']} aria-label="Taggar">
              {recipe.tags.map((tag) => (
                <li key={tag} className={styles['recipe__tag']}>{tag}</li>
              ))}
            </ul>
          )}
          {recipe.source && (
            <p className={styles['recipe__source']}>
              Källa: <a href={recipe.source} target="_blank" rel="noopener noreferrer">{recipe.source}</a>
            </p>
          )}
          {recipe.video_url?.includes('instagram.com') && (
            <p className={styles['recipe__instagram']}>
              <a href={recipe.video_url} target="_blank" rel="noopener noreferrer">
                Se video på Instagram{' '}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{verticalAlign: 'middle', marginBottom: '1px'}}>
                  <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 1h4m0 0v4m0-4L6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </p>
          )}
        </header>

        <section aria-label="Recept" className={styles['recipe__content']}>
          <StepCtx.Provider value={{ checkedSteps, toggleStep }}>
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {recipe.content}
            </ReactMarkdown>
          </StepCtx.Provider>
        </section>
      </article>
    </main>
  );
}
