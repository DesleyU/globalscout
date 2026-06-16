import Link from "next/link";
import { Eye, Play, Star, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type VideoHighlightCardProps = {
  isPremium?: boolean;
};

export function VideoHighlightCard({ isPremium = false }: VideoHighlightCardProps) {
  return (
    <Card className="h-[260px] border-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900">
            Latest Highlights
          </CardTitle>
          <div className="flex items-center gap-1">
            <Video className="size-3 text-blue-600" aria-hidden />
            <span className="text-xs text-gray-500">2 days ago</span>
          </div>
        </div>

        <div className="group relative mb-2 h-[130px] cursor-pointer overflow-hidden rounded-lg bg-gray-900">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#1e293b,#0f172a)]" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition group-hover:bg-black/50">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 shadow-xl transition group-hover:scale-110">
              <Play className="ml-0.5 size-5 fill-white text-white" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-xs font-bold text-white">Season Highlights</p>
            <p className="text-xs text-gray-300">8:42 min</p>
          </div>
          <Badge className="absolute top-2 right-2 gap-1 border-0 bg-red-600 text-[10px] text-white">
            <span className="size-1 animate-pulse rounded-full bg-white" />
            TRENDING
          </Badge>
        </div>

        {isPremium ? (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {["Skills", "Goals"].map((label) => (
              <div
                key={label}
                className="group relative h-[70px] cursor-pointer overflow-hidden rounded-lg bg-gray-900"
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#334155,#1e293b)]" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition group-hover:bg-black/50">
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 transition group-hover:scale-110">
                    <Play className="ml-0.5 size-4 fill-white text-white" />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                  <p className="text-xs font-semibold text-white">{label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {["Skills", "Goals"].map((label) => (
              <div
                key={label}
                className="flex h-[70px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
              >
                <Video className="mb-1 size-5 text-blue-600" />
                <p className="text-xs font-semibold text-gray-600">Premium</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Eye className="size-3 text-gray-500" />
              <span className="text-gray-600">24.5K</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-yellow-500 text-yellow-500" />
              <span className="text-gray-600">1.8K</span>
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-blue-600"
            render={<Link href="/videos" />}
          >
            View All →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
