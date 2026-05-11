import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRecipeBySlug } from '../utils/loadRecipes';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './RecipeDetailPage.module.scss';

function recipeImageUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}images/recipes/${filename}`;
}

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = slug ? getRecipeBySlug(slug) : undefined;

  if (!recipe) {
    return (
      <main className={styles.recipe}>
        <p>Receptet hittades inte. <Link to="/">Tillbaka till recept</Link></p>
      </main>
    );
  }

  return (
    <main className={styles.recipe}>
      <div className={styles['recipe__topbar']}>
        <nav aria-label="Brödsmulor" className={styles['recipe__breadcrumb']}>
          <Link to="/">← Alla recept</Link>
        </nav>
        <ThemeToggle />
      </div>

      <article>
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

        <header className={styles['recipe__header']}>
          {recipe.meal && (
            <span className={styles['recipe__category']} aria-label={`Måltidstyp: ${recipe.meal}`}>
              {recipe.meal}
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
        </header>

        <section aria-label="Recept" className={styles['recipe__content']}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.content}</ReactMarkdown>
        </section>
      </article>
    </main>
  );
}
