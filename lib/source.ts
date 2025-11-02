export const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database.onrender.com';
export const TENANT = process.env.SOURCE_TENANT_ID ?? 'tanja';

export async function sourceFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Tenant', TENANT);
  return fetch(`${SOURCE_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}


