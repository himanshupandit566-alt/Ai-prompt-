export type AspectRatio = '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | '2:3' | '3:2' | '21:9';

export type CategoryName =
  | 'All'
  | 'Cinematic Portraits'
  | 'Realistic Photography'
  | 'Fashion'
  | 'Luxury'
  | 'Couple Portraits'
  | 'Romantic'
  | 'Anime'
  | 'Fantasy'
  | 'Nature'
  | 'Cars'
  | 'Gaming'
  | '3D Art'
  | 'Vintage'
  | 'Professional Profile'
  | 'Festival'
  | 'Wallpapers';

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  category: CategoryName;
  thumbnailUrl: string;
  previewUrl: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  compatibleTools: string[];
  tags: string[];
  featured: boolean;
  popularity: number;
  createdAt: string;
}

export type SortOption = 'latest' | 'popular' | 'alphabetical' | 'featured';

export interface CategoryInfo {
  name: CategoryName;
  slug: string;
  description: string;
  iconName: string;
  featuredImage?: string;
}
