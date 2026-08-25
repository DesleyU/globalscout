import {
  ArrowRight,
  Check,
  Database,
  Minus,
  Shield,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatExternalProvider,
  valuesMatch,
} from "@/features/onboarding/player/formatters";

type ComparisonField = {
  label: string;
  value: string;
};

type ClaimProfileComparisonProps = {
  userFields: ComparisonField[];
  candidateFields: ComparisonField[];
  provider: string;
  candidatePhotoUrl?: string | null;
  candidateName?: string | null;
};

function fieldPairs(
  userFields: ComparisonField[],
  candidateFields: ComparisonField[],
) {
  return userFields.map((userField, index) => ({
    label: userField.label,
    userValue: userField.value,
    candidateValue: candidateFields[index]?.value ?? "—",
    matches: valuesMatch(userField.value, candidateFields[index]?.value ?? ""),
  }));
}

export function ClaimProfileComparison({
  userFields,
  candidateFields,
  provider,
  candidatePhotoUrl,
  candidateName,
}: ClaimProfileComparisonProps) {
  const providerLabel = formatExternalProvider(provider);
  const rows = fieldPairs(userFields, candidateFields);
  const displayName =
    candidateName?.trim() ||
    candidateFields.find((field) => field.label === "Name")?.value ||
    "Selected player";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-white pb-5">
        <CardTitle className="text-lg">Confirm profile match</CardTitle>
        <CardDescription>
          You selected a player record from {providerLabel}. Compare your account
          details with that record to make sure you are claiming the right
          football profile.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="border-b border-gray-100 bg-blue-50/70 p-5 md:border-r md:border-b-0">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                <User className="h-4 w-4 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Your account details
                </p>
                <p className="text-xs text-gray-500">
                  What you entered during onboarding
                </p>
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-center border-b border-gray-100 bg-white px-2 md:flex md:border-b-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
              <ArrowRight className="h-4 w-4" aria-hidden />
            </div>
          </div>

          <div className="border-b border-gray-100 p-5 md:border-b-0">
            <div className="mb-4 flex items-start gap-3">
              <Avatar className="h-11 w-11 shrink-0 rounded-xl">
                <AvatarImage src={candidatePhotoUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-xl bg-green-100 text-sm font-bold text-green-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600">
                    <Database className="h-3.5 w-3.5 text-white" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Selected profile
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Matched record from {providerLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {rows.map(({ label, userValue, candidateValue, matches }) => (
            <div
              key={label}
              className={cn(
                "grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
                !matches && "bg-amber-50/60",
              )}
            >
              <div className="border-b border-gray-100 px-5 py-4 md:border-r md:border-b-0">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {label}
                </p>
                <p className="text-sm font-medium text-gray-900">{userValue}</p>
              </div>

              <div className="hidden items-center justify-center px-2 md:flex">
                {matches ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
              </div>

              <div className="px-5 py-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {label}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    matches ? "text-gray-900" : "text-amber-900",
                  )}
                >
                  {candidateValue}
                </p>
                {!matches ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Slight difference — common for names with accents or spelling
                    variants.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClaimReviewInfoPanel() {
  return (
    <Card className="mb-8 border border-blue-200 bg-blue-50 shadow-sm">
      <CardContent className="flex gap-3 p-5">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="mb-1 text-sm font-semibold text-blue-900">
            Profile review process
          </p>
          <p className="text-sm text-blue-700">
            Your football profile will be reviewed before receiving verified
            status. This usually takes 24–48 hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
