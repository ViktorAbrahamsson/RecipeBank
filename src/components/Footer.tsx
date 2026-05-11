import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

function ForkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#0369a1"/>
      <rect x="11" y="6" width="2" height="8" rx="1" fill="white"/>
      <rect x="15" y="6" width="2" height="8" rx="1" fill="white"/>
      <rect x="19" y="6" width="2" height="8" rx="1" fill="white"/>
      <rect x="11" y="13" width="10" height="2" fill="white"/>
      <rect x="15" y="14" width="2" height="13" rx="1" fill="white"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles['footer__inner']}>
        <div className={styles['footer__brand']}>
          <span className={styles['footer__logo']}>
            <ForkIcon />
            Receptvalvet
          </span>
          <p className={styles['footer__tagline']}>
            En plats för familjens recept — sparade för att delas.
          </p>
        </div>

        <nav aria-label="Sidfot" className={styles['footer__nav']}>
          <h2 className={styles['footer__nav-heading']}>Sidor</h2>
          <ul className={styles['footer__nav-list']}>
            <li><Link to="/">Alla recept</Link></li>
            {/* Framtida sidor läggs till här */}
          </ul>
        </nav>
      </div>

      <p className={styles['footer__copy']}>
        © {new Date().getFullYear()} Receptvalvet
      </p>
    </footer>
  );
}
