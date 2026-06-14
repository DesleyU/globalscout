import { SUBMITTED_INFO_ITEMS } from "@/features/onboarding/player/constants";
import { Card, CardContent } from "@/components/ui/card";

export function SubmittedInfoCard() {
  return (
    <Card className="mb-8 w-full max-w-sm border border-white/10 bg-white/5">
      <CardContent className="space-y-3 p-6">
        {SUBMITTED_INFO_ITEMS.map((text) => (
          <div key={text} className="flex items-start gap-2.5">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <p className="text-sm text-gray-300">{text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
