export const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';
export const TENANT = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';

export async function sourceFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  // Allow override of X-Tenant header, otherwise use default
  if (!headers.has('X-Tenant')) {
    headers.set('X-Tenant', TENANT);
  }
  return fetch(`${SOURCE_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}

/**
 * Tenant Configuration Type
 * Matches the structure stored in customer portal's tenantconfigs collection
 */
export type TenantConfig = {
  tenantId: string;
  giftCardsEnabled?: boolean;
  [key: string]: any; // Allow other config properties
};

/**
 * Fetch tenant configuration from Source database
 * Used to check feature flags like giftCardsEnabled
 * 
 * @param tenantId - The tenant ID to fetch config for (defaults to TENANT)
 * @returns TenantConfig with defaults (giftCardsEnabled: false) if not found/unavailable
 */
export async function getTenantConfig(tenantId: string = TENANT): Promise<TenantConfig> {
  try {
    // Try multiple possible endpoint patterns
    const endpoints = [
      `/api/tenants/${tenantId}/config`,
      `/api/tenantconfigs/${tenantId}`,
      `/v1/tenants/${tenantId}/config`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await sourceFetch(endpoint, {
          headers: {
            'X-Tenant': tenantId
          }
        });

        if (response.ok) {
          const config = await response.json();
          // Handle both direct config object and wrapped responses
          const tenantConfig = config.tenantId ? config : { tenantId, ...config };
          console.log(`✅ Fetched tenant config for ${tenantId} from ${endpoint}`);
          return tenantConfig as TenantConfig;
        }
      } catch (endpointError) {
        // Try next endpoint
        continue;
      }
    }

    // If all endpoints failed, return default config (feature disabled)
    console.warn(`⚠️ Tenant config endpoint not found for ${tenantId}, using defaults (giftCardsEnabled: false)`);
    return { tenantId, giftCardsEnabled: false };
  } catch (error) {
    console.warn(`⚠️ Error fetching tenant config for ${tenantId}:`, error instanceof Error ? error.message : 'Unknown error');
    // Fail gracefully - return default config with feature disabled (safe default)
    return { tenantId, giftCardsEnabled: false };
  }
}


