import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { OnboardingSessionActions } from "@/components/onboarding/onboarding-session-actions";
import { cn } from "@/lib/utils";

type OnboardingHeaderProps = {
  step?: number;
  totalSteps?: number;
  backHref?: string;
};

export function OnboardingHeader({
  step,
  totalSteps,
  backHref,
}: OnboardingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
          ) : null}
          <Image
            src="/logo/globalscout-logo.png"
            alt="GlobalScout"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        <div className="flex items-center gap-4">
          {step && totalSteps ? (
            <div
              className="flex items-center gap-3"
              aria-label={`Step ${step} of ${totalSteps}`}
            >
              <div className="flex gap-1.5" role="list">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    role="listitem"
                    aria-current={index + 1 === step ? "step" : undefined}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index < step ? "w-8 bg-blue-600" : "w-4 bg-gray-200",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {step}/{totalSteps}
              </span>
            </div>
          ) : null}

          <OnboardingSessionActions variant="light" showExit={false} />
        </div>
      </div>
    </header>
  );
}
