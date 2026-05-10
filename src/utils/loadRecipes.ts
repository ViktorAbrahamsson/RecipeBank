import yaml from 'js-yaml';
import { Recipe, RecipeMeta } from '../types/recipe';

const modules = import.meta.glob('../../recipes/*.md', { as: 'raw', eager: true });

function parseFrontmatter(raw: string): { data: RecipeMeta; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Recipe is missing YAML frontmatter');
  return {
    data: yaml.load(match[1]) as RecipeMeta,
    content: match[2].trim(),
  };
}

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

let _recipes: Recipe[] | null = null;

export function loadRecipes(): Recipe[] {
  if (_recipes) return _recipes;
  _recipes = Object.entries(modules).map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw as string);
    return { ...data, slug: slugFromPath(path), content };
  });
  return _recipes;
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return loadRecipes().find((r) => r.slug === slug);
}

export function getAllTags(): string[] {
  const tags = loadRecipes().flatMap((r) => r.tags ?? []);
  return [...new Set(tags)].sort();
}
