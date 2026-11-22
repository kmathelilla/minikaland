export async function assertSuccessfulResponse(response, fallbackMessage) {
  if (response.ok) return response;

  let detail = '';
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') {
      detail = body.detail.trim();
    }
  } catch {
    detail = '';
  }

  throw new Error(
    detail || `${fallbackMessage} HTTP ${response.status}`
  );
}
