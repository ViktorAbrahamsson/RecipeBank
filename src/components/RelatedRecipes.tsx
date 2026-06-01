import { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe } from '../types/recipe';
import { loadRecipes } from '../utils/loadRecipes';
import { RecipeCard } from './RecipeCard';
import styles from './RelatedRecipes.module.scss';

interface Props {
  meals: string[];
  currentSlug: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getVisible() {
  const w = window.innerWidth;
  if (w < 560) return 1;
  if (w < 860) return 2;
  return 3;
}

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function RelatedRecipes({ meals, currentSlug }: Props) {
  const [related, setRelated] = useState<Recipe[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(getVisible);
  const [activeStart, setActiveStart] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollAtDragStart = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    const onResize = () => setVisible(getVisible());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!meals.length) return;
    loadRecipes().then(all => {
      const filtered = all.filter(
        r => r.slug !== currentSlug && r.meal?.some(m => meals.includes(m))
      );
      setRelated(shuffle(filtered));
    });
  }, [meals, currentSlug]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !related.length) return;
    el.scrollLeft = 0;
    const update = () => {
      const item = el.firstElementChild as HTMLElement | null;
      const cardStep = item ? item.offsetWidth + 16 : 276;
      setActiveStart(Math.round(el.scrollLeft / cardStep));
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [related]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      const walk = e.pageX - dragStartX.current;
      if (Math.abs(walk) > 4) hasDragged.current = true;
      trackRef.current.scrollLeft = scrollAtDragStart.current - walk;
    };

    const onMouseUp = () => {
      if (!isDragging.current || !trackRef.current) return;
      isDragging.current = false;
      const el = trackRef.current;
      const item = el.firstElementChild as HTMLElement | null;
      const cardStep = item ? item.offsetWidth + 16 : 276;
      const snapTo = Math.round(el.scrollLeft / cardStep) * cardStep;
      el.style.cursor = '';
      el.style.scrollSnapType = '';
      document.body.style.userSelect = '';
      el.scrollTo({ left: snapTo, behavior: 'smooth' });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX;
    scrollAtDragStart.current = el.scrollLeft;
    el.style.scrollSnapType = 'none';
    el.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  }, []);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const item = el.firstElementChild as HTMLElement | null;
    const step = item ? item.offsetWidth + 16 : 276;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!related.length) return null;

  const showMobileArrows = related.length > 1;
  const showDesktopArrows = related.length > 3;
  const heading =
    meals.length === 1
      ? `Fler ${meals[0].toLowerCase()}recept`
      : meals.length === 2
      ? `Fler ${meals[0].toLowerCase()}- och ${meals[1].toLowerCase()}recept`
      : 'Fler recept';

  return (
    <section className={styles.related} aria-label={heading}>
      {/* Header row: heading always, controls inline on mobile */}
      <div className={styles['related__header']}>
        <h2 className={styles['related__heading']}>{heading}</h2>
        {showMobileArrows && (
          <div className={styles['related__header-controls']}>
            <button className={styles['related__btn']} onClick={() => scroll(-1)} disabled={!canScrollLeft} aria-label="Föregående recept">
              <PrevIcon />
            </button>
            <button className={styles['related__btn']} onClick={() => scroll(1)} disabled={!canScrollRight} aria-label="Nästa recept">
              <NextIcon />
            </button>
          </div>
        )}
      </div>

      <div className={styles['related__slider']}>
        {showDesktopArrows && (
          <button className={`${styles['related__btn']} ${styles['related__side-btn']}`} onClick={() => scroll(-1)} disabled={!canScrollLeft} aria-label="Föregående recept" tabIndex={-1} aria-hidden="true">
            <PrevIcon />
          </button>
        )}
        <div
          className={styles['related__track']}
          ref={trackRef}
          onMouseDown={onMouseDown}
          onClickCapture={onClickCapture}
        >
          {related.map((r, i) => (
            <div
              key={r.slug}
              className={
                styles['related__item'] +
                (i >= activeStart && i < activeStart + visible
                  ? ''
                  : ' ' + styles['related__item--dim'])
              }
            >
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
        {showDesktopArrows && (
          <button className={`${styles['related__btn']} ${styles['related__side-btn']}`} onClick={() => scroll(1)} disabled={!canScrollRight} aria-label="Nästa recept" tabIndex={-1} aria-hidden="true">
            <NextIcon />
          </button>
        )}
      </div>
    </section>
  );
}
