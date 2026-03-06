import { sourceFetch, TENANT } from './source';

/**
 * Tenant → Stripe Connect account mapping
 *
 * IMPORTANT ARCHITECTURE:
 * - Webshop must NOT talk to MongoDB directly.
 * - All tenant data (including Stripe Connect account) is resolved via Source Portal.
 *
 * Source Portal exposes an HTTP endpoint, e.g.:
 *   GET /api/tenants/{tenantId}/stripe-account
 *   → { accountId: "acct_xxx" }
 *
 * This helper calls that endpoint and returns the Stripe Connect accountId.
 */
export async function getTenantStripeConnectAccountId(
  tenantId: string
): Promise<string | undefined> {
  try {
    const effectiveTenantId = tenantId || TENANT;

    // Try a small set of possible endpoint paths for robustness
    const endpoints = [
      `/api/tenants/${effectiveTenantId}/stripe-account`,
      `/v1/tenants/${effectiveTenantId}/stripe-account`
    ];

    for (const path of endpoints) {
      try {
        const res = await sourceFetch(path, {
          headers: {
            'X-Tenant': effectiveTenantId
          }
        });

        if (!res.ok) {
          continue; // try next endpoint
        }

        const data = await res.json();
        const accountId = (data && (data.accountId || data.accountID)) as
          | string
          | undefined;

        if (accountId) {
          console.log(
            '[getTenantStripeConnectAccountId] Resolved Stripe Connect account via Source Portal:',
            { tenantId: effectiveTenantId, accountId, endpoint: path }
          );
          return accountId;
        }
      } catch {
        // Try next endpoint
        continue;
      }
    }

    console.warn(
      '[getTenantStripeConnectAccountId] No Stripe Connect accountId resolved for tenant via Source Portal:',
      effectiveTenantId
    );
    return undefined;
  } catch (error) {
    console.error(
      '[getTenantStripeConnectAccountId] Error resolving Stripe Connect accountId via Source Portal for tenant:',
      tenantId || TENANT,
      error instanceof Error ? error.message : error
    );
    return undefined;
  }
}


