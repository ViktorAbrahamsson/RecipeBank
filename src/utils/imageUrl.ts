import { supabase } from './supabaseClient';

export function recipeImageUrl(filename: string): string {
  return supabase.storage.from('recipe-images').getPublicUrl(filename).data.publicUrl;
}
