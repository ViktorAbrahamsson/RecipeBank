import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRecipeBySlug } from '../utils/loadRecipes';
import styles from './RecipeDetailPage.module.scss';

function recipeImageUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}images/recipes/${filename}`;
}

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = slug ? getRecipeBySlug(slug) : undefined;

  if (!recipe) {
    return (
      <main className={styles.page}>
        <p>Receptet hittades inte. <Link to="/">Tillbaka till recept</Link></p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link to="/">← Alla recept</Link>
      </nav>

      {recipe.image && (
        <div className={styles.hero}>
          <img
            src={recipeImageUrl(recipe.image)}
            alt={recipe.title}
            className={styles.heroImage}
          />
        </div>
      )}

      <header className={styles.header}>
        <span className={styles.category}>{recipe.category}</span>
        <h1>{recipe.title}</h1>
        <div className={styles.meta}>
          <span>{recipe.servings} portioner</span>
          <span>{recipe.prep_time}</span>
          {recipe.author && <span>Av {recipe.author}</span>}
        </div>
        {recipe.description && <p className={styles.description}>{recipe.description}</p>}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </header>

      <article className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.content}</ReactMarkdown>
      </article>
    </main>
  );
}
