export interface RecipeMeta {
  title: string;
  meal?: string[];
  type?: string;
  servings: number;
  prep_time: string;
  author?: string;
  description?: string;
  image?: string;
  source?: string;
  video_url?: string;
  tags?: string[];
}

export interface Recipe extends RecipeMeta {
  slug: string;
  content: string;
}
