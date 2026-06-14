import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PlayerCard } from "@/components/dashboard/player-card";
import { Button } from "@/components/ui/button";

type PlayerProfileHeaderProps = {
  name: string;
  position: string;
  positionShort: string;
  club?: string | null;
  nationality?: string | null;
  age?: number | null;
  jerseyNumber?: string | null;
  imageUrl?: string | null;
  profileViews?: number | null;
  profileViewsTrend?: string | null;
};

export function PlayerProfileHeader({
  name,
  position,
  positionShort,
  club,
  nationality,
  age,
  jerseyNumber,
  imageUrl,
  profileViews,
  profileViewsTrend,
}: PlayerProfileHeaderProps) {
  const details = [
    position,
    jerseyNumber ? `#${jerseyNumber}` : null,
    club,
    age ? `${age} years old` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
      <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <PlayerCard
            name={name}
            position={positionShort}
            imageUrl={imageUrl}
            club={club}
            nationality={nationality}
          />
          <div>
            <h1 className="mb-1 text-3xl font-bold">{name}</h1>
            <p className="text-sm text-gray-300">{details}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                render={<Link href="/profile" />}
              >
                Edit Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Share Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1 text-sm text-gray-400">Profile Views (7 days)</div>
          <div className="text-4xl font-bold text-blue-400">
            {profileViews?.toLocaleString() ?? "—"}
          </div>
          {profileViewsTrend ? (
            <div className="mt-1 flex items-center justify-end text-sm text-green-400">
              <TrendingUp className="mr-1 size-4" aria-hidden />
              {profileViewsTrend}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
