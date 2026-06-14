import { Separator } from "@/components/ui/separator";

export function SocialAuthButtons() {
  return (
    <>
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-gray-400">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 transition"
          title="Coming soon"
        >
          <span className="text-base leading-none font-bold">G</span>
          Google
        </button>
        <button
          type="button"
          disabled
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 transition"
          title="Coming soon"
        >
          <span className="text-base leading-none font-bold">⌘</span>
          Apple
        </button>
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
