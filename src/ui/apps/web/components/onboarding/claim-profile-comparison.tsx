import { Shield, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ComparisonField = {
  label: string;
  value: string;
};

type ClaimProfileComparisonProps = {
  userFields: ComparisonField[];
  candidateFields: ComparisonField[];
};

export function ClaimProfileComparison({
  userFields,
  candidateFields,
}: ClaimProfileComparisonProps) {
  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b border-gray-100 bg-blue-50 p-6 md:border-r md:border-b-0">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Global Scout
            </span>
          </div>
          <div className="space-y-4">
            {userFields.map(({ label, value }) => (
              <div key={label}>
                <p className="mb-0.5 text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Football Database
            </span>
          </div>
          <div className="space-y-4">
            {candidateFields.map(({ label, value }) => (
              <div key={label}>
                <p className="mb-0.5 text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
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
