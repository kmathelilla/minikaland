
import {
  type Activity,
  type Category,
  type SearchFilters,
} from './activities';

export type RecommendationResponse = {
  activities: Activity[];
  source: 'sample' | 'gemini';
};

type GeminiActivity = {
  title: string;
  materials: string[];
  steps: string[];
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';

export async function recommendActivities(
  filters: SearchFilters
): Promise<RecommendationResponse> {

  // Egyelőre az első kiválasztott kategóriát használjuk.
  // A több skill kombinálását később a backend végzi.
  const category: Category =
    filters.categories[0] ?? 'montessori';

  // A frontend szabad szövegét és kategóriáját
  // egyelőre közös témaként küldjük.
  const theme = [
    filters.prompt.trim(),
    category,
  ].filter(Boolean).join(', ');

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/jatek`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      age: filters.age,
      duration: filters.duration,
      theme,
      skills: filters.categories,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Nem sikerült a játékötlet generálása. HTTP ${response.status}`
    );
  }

  const data: GeminiActivity = await response.json();

  // A Gemini válaszát a React által elvárt
  // Activity formátumra alakítjuk.
  const activity: Activity = {
    id: crypto.randomUUID(),
    name: data.title,
    description: data.title,
    category,
    duration: filters.duration,
    ageMin: filters.age,
    ageMax: filters.age,
    materials: data.materials,
    steps: data.steps,
    safety: 'A tevékenység felnőtt felügyeletével ajánlott.',
  };

  return {
    activities: [activity],
    source: 'gemini',
  };
}
