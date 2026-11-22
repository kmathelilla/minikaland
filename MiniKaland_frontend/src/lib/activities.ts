export type Category =
  | 'montessori'
  | 'fejleszto'
  | 'kreativ'
  | 'mozgasos';

export type Location = 'bent' | 'kint' | 'mindegy';

export type Activity = {
  id: string;
  name: string;
  category: Category;
  duration: number;
  ageMin: number;
  ageMax: number;
  subtitle?: string;
  location: Exclude<Location, 'mindegy'>;
  materials: string[];
  description: string;
  steps: string[];
  safety: string;
  image: string;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  montessori: 'Montessori',
  fejleszto: 'Készségfejlesztő',
  kreativ: 'Kreatív',
  mozgasos: 'Mozgásos',
};

export type SearchFilters = {
  prompt: string;
  age: number;
  duration: number;
  location: Location;
  categories: Category[];
};
