
import {
  type Activity,
  type Category,
  type SearchFilters,
} from './activities';

export type RecommendationResponse = {
  activities: GeneratedActivity[];
  source: 'sample' | 'gemini';
};

export type ActivityGenerationRequest = {
  age: number;
  duration: number;
  theme: string;
  skills: Category[];
  previous_titles?: string[];
};

export type DevelopmentAreaRating = {
  name: string;
  stars: 1 | 2 | 3;
};

export type GeneratedActivity = Activity & {
  developmentAreas?: DevelopmentAreaRating[];
};

type ActivityToolRequest = {
  title: string;
  description: string;
  materials: string[];
  steps: string[];
  age: number;
  duration: number;
  skills: Category[];
};

type AdventureSheetRequest = ActivityToolRequest & {
  safety: string;
};

type ActivityEvaluationResponse = {
  areas: DevelopmentAreaRating[];
};

type GeminiActivity = {
  title: string;
  subtitle: string | null;
  materials: string[];
  steps: string[];
  age: number;
  duration: number;
  skills: Category[];
  safety: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';

const categoryImages: Record<Category, string> = {
  montessori: '/images/galeria-kucko.jpg',
  fejleszto: '/images/galeria-raketa.jpg',
  kreativ: '/images/galeria-alkotas.jpg',
  mozgasos: '/images/galeria-raketa.jpg',
};

function activityToolRequest(activity: GeneratedActivity): ActivityToolRequest {
  return {
    title: activity.name,
    description: activity.subtitle ?? activity.name,
    materials: activity.materials,
    steps: activity.steps,
    age: activity.ageMin,
    duration: activity.duration,
    skills: [activity.category],
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error: { detail?: string } = await response.json();
    throw new Error(
      error.detail ??
      `Nem sikerült a kérés. HTTP ${response.status}`
    );
  }

  return response.json();
}

export async function recommendActivities(
  filters: SearchFilters,
  previousTitles: string[] = []
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

  const requestBody: ActivityGenerationRequest = {
    age: filters.age,
    duration: filters.duration,
    theme,
    skills: filters.categories,
    previous_titles: previousTitles,
  };

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/jatek`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
  const activity: GeneratedActivity = {
    id: crypto.randomUUID(),
    name: data.title,
    subtitle: data.subtitle ?? undefined,
    description: data.subtitle ?? '',
    category,
    duration: data.duration,
    ageMin: data.age,
    ageMax: data.age,
    location: filters.location === 'kint' ? 'kint' : 'bent',
    materials: data.materials,
    steps: data.steps,
    safety: data.safety,
    keywords: [],
    image: categoryImages[category],
    accent: '#9abbd8',
  };

  return {
    activities: [activity],
    source: 'gemini',
  };
}

export async function evaluateActivity(
  activity: GeneratedActivity
): Promise<ActivityEvaluationResponse> {
  return post<ActivityEvaluationResponse>(
    '/jatek/ertekeles',
    activityToolRequest(activity)
  );
}

export async function generateAdventureSheet(
  activity: GeneratedActivity
): Promise<{ blob: Blob; filename: string }> {
  const body: AdventureSheetRequest = {
    ...activityToolRequest(activity),
    safety: activity.safety,
  };
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/jatek/kalandlap`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error: { detail?: string } = await response.json();
    throw new Error(
      error.detail ??
      `Nem sikerült a kalandlap készítése. HTTP ${response.status}`
    );
  }

  if (!response.headers.get('content-type')?.startsWith('application/pdf')) {
    throw new Error('A szerver nem PDF kalandlapot küldött vissza.');
  }

  const contentDisposition =
    response.headers.get('content-disposition') ?? '';
  const filename =
    /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1] ??
    'minikaland-kalandlap.pdf';

  return {
    blob: await response.blob(),
    filename,
  };
}
