import { ChangeEvent, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { recipeImageUrl } from '../../utils/imageUrl';
import styles from './ImageUpload.module.scss';

interface Props {
  currentImage?: string;
  onUpload: (filename: string) => void;
}

export function ImageUpload({ currentImage, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(file.name, file, { upsert: true });
    setUploading(false);
    if (error) {
      setError('Uppladdning misslyckades.');
    } else {
      onUpload(file.name);
    }
  }

  return (
    <div className={styles['image-upload']}>
      {currentImage && (
        <img
          src={recipeImageUrl(currentImage)}
          alt="Receptbild"
          className={styles['image-upload__preview']}
        />
      )}
      <label className={styles['image-upload__label']}>
        {uploading ? 'Laddar upp…' : currentImage ? 'Byt bild' : 'Välj bild'}
        <input
          type="file"
          accept="image/*"
          className={styles['image-upload__input']}
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      {error && <p className={styles['image-upload__error']}>{error}</p>}
    </div>
  );
}
