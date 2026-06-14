using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace GlobalScout.Api.IntegrationTests.Billing;

/// <summary>Builds a Stripe-Signature header compatible with <see cref="Stripe.EventUtility.ConstructEvent"/> (test secret as UTF-8 key).</summary>
internal static class StripeWebhookTestSigner
{
    public static string CreateSignatureHeader(string webhookSecret, string jsonBody)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var payload = string.Create(CultureInfo.InvariantCulture, $"{timestamp}.{jsonBody}");
        var key = Encoding.UTF8.GetBytes(webhookSecret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        using var hmac = new HMACSHA256(key);
        var hash = hmac.ComputeHash(payloadBytes);
        var sig = Convert.ToHexString(hash).ToLowerInvariant();
        return string.Create(CultureInfo.InvariantCulture, $"t={timestamp},v1={sig}");
    }
}
