export interface RecipeMeta {
  title: string;
  category: string;
  servings: number;
  prep_time: string;
  author?: string;
  description?: string;
  image?: string;
  tags?: string[];
}

export interface Recipe extends RecipeMeta {
  slug: string;
  content: string;
}
