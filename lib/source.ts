/**
 * Get Source Database URL - MANDATORY, no fallbacks
 * Throws error if missing to prevent silent failures
 * Lazy evaluation - only validates when actually called (not at module load time)
 */
export function getSourceDatabaseUrl(): string {
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

// Lazy evaluation - only get tenant at runtime, not at module load time
function getTenant(): string {
  return getTenantId();
}

export async function sourceFetch(path: string, init: RequestInit = {}) {
  // Validate URL lazily (only when function is called, not at module load)
  const sourceBase = getSourceDatabaseUrl();
  const tenant = getTenant();
  
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  // Allow override of X-Tenant header, otherwise use default
  if (!headers.has('X-Tenant')) {
    headers.set('X-Tenant', tenant);
  }
  return fetch(`${sourceBase}${path}`, { ...init, headers, cache: 'no-store' });
}


