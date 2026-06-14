import {
  billingPaths,
  type ApiTransport,
  type CreateBillingPortalSessionResult,
  type CreateCheckoutSessionResult,
} from "@globalscout/shared";

export function createBillingApi(client: ApiTransport) {
  return {
    createCheckoutSession() {
      return client.post<CreateCheckoutSessionResult>(
        billingPaths.checkoutSession,
      );
    },

    createPortalSession() {
      return client.post<CreateBillingPortalSessionResult>(
        billingPaths.portalSession,
      );
    },
  };
}

export type BillingApi = ReturnType<typeof createBillingApi>;
