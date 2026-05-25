import { Link } from 'react-router-dom';
import { Recipe } from '../types/recipe';
import { recipeImageUrl } from '../utils/imageUrl';
import styles from './RecipeCard.module.scss';

interface Props {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: Props) {
  return (
    <article className={styles.card}>
      <Link
        to={`/recept/${recipe.slug}`}
        className={styles['card__link']}
        aria-label={recipe.title}
      >
        <div className={styles['card__image-wrapper']}>
          {recipe.image ? (
            <img
              src={recipeImageUrl(recipe.image)}
              alt=""
              loading="lazy"
              className={styles['card__image']}
            />
          ) : (
            <div className={styles['card__image-placeholder']} aria-hidden="true" />
          )}
        </div>
        <div className={styles['card__body']}>
          {recipe.meal && <span className={styles['card__category']}>{recipe.meal}</span>}
          <h3 className={styles['card__title']}>{recipe.title}</h3>
          <ul className={styles['card__meta']}>
            <li>{recipe.servings} portioner</li>
            <li>{recipe.prep_time}</li>
          </ul>
          {recipe.description && <p className={styles['card__description']}>{recipe.description}</p>}
          {recipe.author && <p className={styles['card__author']}>{recipe.author}</p>}
        </div>
      </Link>
    </article>
  );
}
