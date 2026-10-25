const defaultApiUrl =
  window.location.hostname === 'localhost' && ['3000', '5173'].includes(window.location.port)
    ? 'http://localhost:4000'
    : window.location.origin;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiUrl).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiRequest = async <T>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      typeof result.error === 'string' ? result.error : `Permintaan gagal (${response.status}).`,
      response.status
    );
  }
  return result as T;
};
