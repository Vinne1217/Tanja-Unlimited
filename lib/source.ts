/**
 * Get Source Database URL - MANDATORY, no fallbacks
 * Throws error if missing to prevent silent failures
 */
function getSourceDatabaseUrl(): string {
  const url = process.env.SOURCE_DATABASE_URL;
  if (!url) {
    const error = 'SOURCE_DATABASE_URL environment variable is required. Set it to your Google Cloud Run Source Database URL.';
    console.error(`[Source] ERROR: ${error}`);
    throw new Error(error);
  }
  return url;
}

/**
 * Get tenant ID - consistent across backend and frontend
 * Defaults to 'tanjaunlimited' if not set
 */
export function getTenantId(): string {
  return process.env.SOURCE_TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || 'tanjaunlimited';
}

export const SOURCE_BASE = getSourceDatabaseUrl();
export const TENANT = getTenantId();

export async function sourceFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  // Allow override of X-Tenant header, otherwise use default
  if (!headers.has('X-Tenant')) {
    headers.set('X-Tenant', TENANT);
  }
  return fetch(`${SOURCE_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}


