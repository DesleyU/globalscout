import { Separator } from "@/components/ui/separator";
import { getPublicApiBaseUrl } from "@/lib/env";

/** One of the ASP.NET Core authentication scheme names registered in ExternalAuthenticationExtensions. */
type ExternalProvider = "google" | "facebook" | "apple";

function externalChallengeHref(provider: ExternalProvider): string {
  // Plain browser navigation (not fetched via XHR/JSON) straight to the API - it owns the OAuth2
  // challenge/callback round-trip. See contracts/api-auth-external.md.
  return `${getPublicApiBaseUrl()}/auth/external/${provider}/challenge`;
}

export function SocialAuthButtons() {
  return (
    <>
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-gray-400">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <a
          href={externalChallengeHref("google")}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <span className="text-base leading-none font-bold">G</span>
          <span className="sr-only">Continue with Google</span>
        </a>
        <a
          href={externalChallengeHref("facebook")}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <span className="text-base leading-none font-bold">f</span>
          <span className="sr-only">Continue with Facebook</span>
        </a>
        <a
          href={externalChallengeHref("apple")}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <span className="text-base leading-none font-bold">⌘</span>
          <span className="sr-only">Continue with Apple</span>
        </a>
      </div>
    </>
  );
}

export function AuthLegalFooter() {
  return (
    <p className="mt-6 text-center text-xs text-gray-400">
      By continuing you agree to our{" "}
      <span className="underline hover:text-gray-600">Terms</span> and{" "}
      <span className="underline hover:text-gray-600">Privacy Policy</span>.
    </p>
  );
}
