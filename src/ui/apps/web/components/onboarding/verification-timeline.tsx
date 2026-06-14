import { Check, Clock } from "lucide-react";
import { VERIFICATION_TIMELINE_STEPS } from "@/features/onboarding/player/constants";
import { cn } from "@/lib/utils";

export function VerificationTimeline() {
  return (
    <div className="mb-10 w-full max-w-sm">
      {VERIFICATION_TIMELINE_STEPS.map((step, index) => (
        <div key={step.label} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                step.done
                  ? "bg-green-500"
                  : "pending" in step && step.pending
                    ? "border-2 border-blue-500 bg-blue-600/30"
                    : "bg-gray-700",
              )}
            >
              {step.done ? (
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              ) : "pending" in step && step.pending ? (
                <Clock className="h-4 w-4 text-blue-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-500" />
              )}
            </div>
            {index < VERIFICATION_TIMELINE_STEPS.length - 1 ? (
              <div
                className={cn(
                  "mt-1 h-8 w-0.5",
                  index < 3 ? "bg-green-500/40" : "bg-gray-700",
                )}
              />
            ) : null}
          </div>
          <div className="pb-8 pt-1">
            <p
              className={cn(
                "text-sm font-medium",
                step.done
                  ? "text-white"
                  : "pending" in step && step.pending
                    ? "text-blue-300"
                    : "text-gray-500",
              )}
            >
              {step.done ? "✓ " : "pending" in step && step.pending ? "⏳ " : ""}
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
