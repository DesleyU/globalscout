import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="relative h-32 bg-gradient-to-r from-gray-200 to-gray-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-400">Profile banner</span>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-4 -mt-14 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <div className="pb-2">
              <div className="mb-2 h-6 w-40 rounded-lg bg-gray-200" />
              <div className="h-4 w-28 rounded-lg bg-gray-100" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {["Matches", "Goals", "Assists"].map((stat) => (
              <div
                key={stat}
                className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center"
              >
                <div className="text-2xl font-bold text-gray-300">—</div>
                <div className="mt-1 text-xs text-gray-400">{stat}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 opacity-50 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 h-5 w-36 rounded-lg bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
