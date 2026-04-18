# Stripe billing (local development)

Premium subscriptions use **Stripe Checkout** (hosted) and **webhooks** to sync `AccountType` and the `subscriptions` table.

## Configuration (.NET API)

Bind these under the `Stripe` section (see [`appsettings.json`](../src/GlobalScout/GlobalScout.Api/appsettings.json)):

| Key | Purpose |
|-----|---------|
| `SecretKey` | `sk_test_…` — server-side API calls (Checkout, Customer Portal). |
| `WebhookSecret` | Signing secret from the Dashboard webhook endpoint, or from `stripe listen` (starts with `whsec_…`). |
| `PublishableKey` | `pk_test_…` — optional for the SPA if you add Stripe.js later. |
| `PremiumPriceId` | Recurring **Price** id (`price_…`) for Premium. |
| `PublicAppBaseUrl` | SPA origin, e.g. `http://localhost:5173` (no trailing slash). |
| `CheckoutSuccessPath` / `CheckoutCancelPath` | Paths appended to `PublicAppBaseUrl` after Checkout. |
| `BillingPortalReturnPath` | Return path after Stripe Customer Portal. |

**User secrets (recommended):**

```bash
cd src/GlobalScout/GlobalScout.Api
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."
dotnet user-secrets set "Stripe:PremiumPriceId" "price_..."
```

## Stripe CLI: forward webhooks to localhost

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`.
3. Forward events to the API (adjust port and path if needed):

```bash
stripe listen --forward-to https://localhost:7xxx/api/billing/webhook
```

The CLI prints a **webhook signing secret** (`whsec_…`). Put that value in `Stripe:WebhookSecret` for local runs so signature verification matches forwarded events.

4. Trigger a test event (optional):

```bash
stripe trigger checkout.session.completed
```

## Frontend

- Set `VITE_API_URL` to your API base (e.g. `https://localhost:7xxx/api`).
- Optional: `VITE_STRIPE_PUBLISHABLE_KEY` if you add client-side Stripe.js later (Checkout redirect does not require it).

Upgrade flow: `POST /api/billing/checkout-session` (authenticated) → redirect to returned `url` → Stripe sends `checkout.session.completed` to `/api/billing/webhook` → user becomes **PREMIUM** in the database.

## Tests

- **Unit:** `CreateCheckoutSessionCommandHandlerTests` (Moq).
- **Integration:** `BillingIntegrationTests` — signs webhook payloads with the same HMAC scheme as Stripe’s `Stripe-Signature` header and asserts account tier after `checkout.session.completed`.

## Customer Portal

`POST /api/billing/portal-session` (authenticated) returns a URL when the user already has a `StripeCustomerId` (set after the first successful checkout webhook).
