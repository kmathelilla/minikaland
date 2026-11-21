import { findActivities, type Activity, type SearchFilters } from './activities';

export type RecommendationResponse = {
  activities: Activity[];
  source: 'sample' | 'gemini';
};

/**
 * DEMÓ-MÓD: helyi, átlátható mintajáték-adatbázist használ.
 * Később itt cserélhető Gemini + FastAPI hívásra, a frontend változtatása nélkül.
 */
export async function recommendActivities(filters: SearchFilters): Promise<RecommendationResponse> {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });
    if (!response.ok) throw new Error('A szerver most nem elérhető. Próbáld újra később.');
    return response.json() as Promise<RecommendationResponse>;
  }
  return { activities: findActivities(filters), source: 'sample' };
}
