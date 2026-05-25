import { Recipe } from '../types/recipe';
import { supabase } from './supabaseClient';

export { supabase };

let _recipes: Recipe[] | null = null;

export function clearRecipeCache(): void {
  _recipes = null;
}

export async function loadRecipes(): Promise<Recipe[]> {
  if (_recipes) return _recipes;
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  _recipes = data as Recipe[];
  return _recipes;
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as Recipe;
}

export async function getAllMeals(): Promise<string[]> {
  const recipes = await loadRecipes();
  const meals = recipes.map((r) => r.meal).filter(Boolean) as string[];
  return [...new Set(meals)].sort();
}

export async function getAllTypes(): Promise<string[]> {
  const recipes = await loadRecipes();
  const types = recipes.map((r) => r.type).filter(Boolean) as string[];
  return [...new Set(types)].sort();
}

export async function getAllTags(): Promise<string[]> {
  const recipes = await loadRecipes();
  const tags = recipes.flatMap((r) => r.tags ?? []);
  return [...new Set(tags)].sort();
}
