import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import styles from './LoginPage.module.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Fel e-post eller lösenord.');
    } else {
      navigate('/admin');
    }
  }

  return (
    <main className={styles.login}>
      <div className={styles['login__card']}>
        <h1 className={styles['login__title']}>Receptvalvet Admin</h1>
        <form onSubmit={handleSubmit} className={styles['login__form']}>
          <label htmlFor="email" className={styles['login__label']}>E-post</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={styles['login__input']}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password" className={styles['login__label']}>Lösenord</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className={styles['login__input']}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className={styles['login__error']} role="alert">{error}</p>}
          <button type="submit" className={styles['login__btn']} disabled={loading}>
            {loading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </main>
  );
}
