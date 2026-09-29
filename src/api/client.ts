const API_ROOT = "/dutyy/API/v1";
let csrfToken: string | null = null;

export class ApiError extends Error {
  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
  }
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!["GET", "OPTIONS", "HEAD"].includes(method) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const nextCsrfToken = response.headers.get("X-CSRF-Token");
  if (nextCsrfToken) csrfToken = nextCsrfToken;

  if (response.status === 204) {
    if (!response.ok) throw new ApiError(response.status, null);
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}
