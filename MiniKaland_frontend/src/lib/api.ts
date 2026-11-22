
import {
  type Activity,
  type Category,
  type SearchFilters,
} from './activities';
import { assertSuccessfulResponse } from './apiErrors';

export type RecommendationResponse = {
  activities: GeneratedActivity[];
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
  skills: Category[];
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

function apiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

function activityToolRequest(activity: GeneratedActivity): ActivityToolRequest {
  return {
    title: activity.name,
    description: activity.subtitle ?? activity.name,
    materials: activity.materials,
    steps: activity.steps,
    age: activity.ageMin,
    duration: activity.duration,
    skills: activity.skills,
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await assertSuccessfulResponse(response, 'Nem sikerült a kérés.');
  return response.json();
}

export async function recommendActivities(
  filters: SearchFilters,
  previousTitles: string[] = []
): Promise<RecommendationResponse> {
  const category: Category =
    filters.categories[0] ?? 'montessori';

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

  const data = await postJson<GeminiActivity>('/jatek', requestBody);
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
    skills: data.skills,
    image: categoryImages[category],
  };

  return {
    activities: [activity],
  };
}

export async function evaluateActivity(
  activity: GeneratedActivity
): Promise<ActivityEvaluationResponse> {
  return postJson<ActivityEvaluationResponse>(
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
  const response = await fetch(apiUrl('/jatek/kalandlap'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await assertSuccessfulResponse(
    response,
    'Nem sikerült a kalandlap készítése.',
  );

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
