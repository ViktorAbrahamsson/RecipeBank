import { Link } from 'react-router-dom';
import { Recipe } from '../types/recipe';
import styles from './RecipeCard.module.scss';

interface Props {
  recipe: Recipe;
}

function recipeImageUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}images/recipes/${filename}`;
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Link to={`/recipes/${recipe.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {recipe.image ? (
          <img
            src={recipeImageUrl(recipe.image)}
            alt={recipe.title}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      <div className={styles.body}>
        {recipe.meal && <span className={styles.category}>{recipe.meal}</span>}
        <h2 className={styles.title}>{recipe.title}</h2>
        <div className={styles.meta}>
          <span>{recipe.servings} portioner</span>
          <span>{recipe.prep_time}</span>
        </div>
        {recipe.description && <p className={styles.description}>{recipe.description}</p>}
        {recipe.author && <span className={styles.author}>{recipe.author}</span>}
      </div>
    </Link>
  );
}
