"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PlayerProfileHeader } from "@/components/dashboard/player-profile-header";
import { SourceBadge } from "@/components/dashboard/source-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RefreshStatsButton } from "@/features/statistics/refresh-stats-button";
import { ManualSeasonForm } from "@/features/statistics/manual-season-form";
import type { StatisticsViewModel } from "@/features/statistics/build-statistics-view";
import { createBrowserStatsApi } from "@/lib/api/stats-browser";

type StatisticsHeader = {
  name: string;
  position: string;
  positionShort: string;
  club?: string | null;
  nationality?: string | null;
  age?: number | null;
  imageUrl?: string | null;
  profileViews?: number | null;
  identityBadge?: string | null;
};

type StatisticsContentProps = {
  header: StatisticsHeader;
  model: StatisticsViewModel;
  lockedSeasons: string[];
  isPremium?: boolean;
  defaultCountry?: string | null;
};

export function StatisticsContent({
  header,
  model,
  lockedSeasons,
  isPremium = false,
  defaultCountry = null,
}: StatisticsContentProps) {
  const router = useRouter();
  const { seasons, profileExtras, lastUpdated, career, hasLinkedProvider } = model;
  const [selectedKey, setSelectedKey] = useState(seasons[0]?.key ?? "");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<string | null>(null);

  const selectedSeason =
    seasons.find((season) => season.key === selectedKey) ?? seasons[0] ?? null;

  async function handleDeleteSeason(season: string) {
    setDeletingSeason(season);
    try {
      const api = createBrowserStatsApi();
      await api.deleteMySeason(season);
      toast.success("Season removed.");
      setFormMode(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete season",
      );
    } finally {
      setDeletingSeason(null);
    }
  }

  return (
    <div className="p-8">
      <PlayerProfileHeader
        name={header.name}
        position={header.position}
        positionShort={header.positionShort}
        club={header.club}
        nationality={header.nationality}
        age={header.age}
        imageUrl={header.imageUrl}
        profileViews={header.profileViews}
        identityBadge={header.identityBadge}
      />

      {career ? (
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Career totals</h3>
                <p className="text-sm text-muted-foreground">
                  Combined across {career.totalSeasons} season
                  {career.totalSeasons === 1 ? "" : "s"}
                  {career.selfReportedSeasons > 0
                    ? ` (${career.selfReportedSeasons} self-reported)`
                    : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
              <StatCard label="Goals" value={career.goals} color="blue" />
              <StatCard label="Assists" value={career.assists} color="green" />
              <StatCard label="Apps" value={career.appearances} color="purple" />
              <StatCard label="Minutes" value={career.minutes} color="orange" />
              <StatCard label="Rating" value={career.rating} color="amber" />
              <StatCard label="YC" value={career.yellowCards} color="yellow" />
              <StatCard label="RC" value={career.redCards} color="red" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Season statistics</h2>
          <p className="text-sm text-muted-foreground">
            Pull verified stats from API-Football or add your own season history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormMode("add")}
            disabled={formMode !== null}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add season
          </Button>
          {hasLinkedProvider ? (
            <RefreshStatsButton lastUpdated={lastUpdated} />
          ) : null}
        </div>
      </div>

      {formMode === "add" ? (
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Add a season</h3>
            <ManualSeasonForm
              lockedSeasons={lockedSeasons}
              initialCountry={defaultCountry ?? ""}
              isPremium={isPremium}
              onCancel={() => setFormMode(null)}
              onSuccess={() => {
                setFormMode(null);
                toast.success("Season saved.");
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {profileExtras ? (
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="flex flex-wrap gap-x-10 gap-y-3 p-5 text-sm">
            {profileExtras.height ? (
              <ProfileFact label="Height" value={profileExtras.height} />
            ) : null}
            {profileExtras.weight ? (
              <ProfileFact label="Weight" value={profileExtras.weight} />
            ) : null}
            {profileExtras.birthDate ? (
              <ProfileFact label="Date of birth" value={profileExtras.birthDate} />
            ) : null}
            {profileExtras.birthPlace ? (
              <ProfileFact label="Birthplace" value={profileExtras.birthPlace} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {seasons.length === 0 || !selectedSeason ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-10 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              No statistics yet
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Add your season history manually or connect your football identity
              to pull verified stats from API-Football.
            </p>
            <Button variant="outline" size="sm" onClick={() => setFormMode("add")}>
              <Plus className="h-4 w-4" aria-hidden />
              Add your first season
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {seasons.length > 1 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {seasons.map((season) => (
                <button
                  key={season.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(season.key);
                    setFormMode(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    season.key === selectedSeason.key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{season.seasonLabel}</span>
                  <SourceBadge
                    label={season.sourceLabel}
                    variant={season.sourceBadgeVariant}
                  />
                </button>
              ))}
              {selectedSeason.editable ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormMode("edit")}
                    disabled={formMode === "edit"}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSeason(selectedSeason.season)}
                    disabled={deletingSeason === selectedSeason.season}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Season {selectedSeason.seasonLabel}
              </span>
              <SourceBadge
                label={selectedSeason.sourceLabel}
                variant={selectedSeason.sourceBadgeVariant}
              />
              {selectedSeason.editable ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormMode("edit")}
                    disabled={formMode === "edit"}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSeason(selectedSeason.season)}
                    disabled={deletingSeason === selectedSeason.season}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {formMode === "edit" && selectedSeason.editable ? (
            <Card className="mb-6 border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Edit {selectedSeason.seasonLabel}
                </h3>
                {selectedSeason.editFormValues ? (
                  <ManualSeasonForm
                    key={selectedSeason.key}
                    lockedSeasons={lockedSeasons}
                    initialSeason={selectedSeason.season}
                    initialValues={selectedSeason.editFormValues}
                    isPremium={isPremium}
                    onCancel={() => setFormMode(null)}
                    onSuccess={() => {
                      setFormMode(null);
                      toast.success("Season updated.");
                      router.refresh();
                    }}
                    submitLabel="Update season"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This season was saved in an older format without competition
                    details. Delete it and add a new season to replace it.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="border-b px-6 py-4">
                <h3 className="font-semibold text-foreground">
                  Competition breakdown
                </h3>
                <p className="text-sm text-muted-foreground">
                  Per club and competition for the {selectedSeason.seasonLabel} season.
                </p>
              </div>
              {selectedSeason.competitions.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No per-competition breakdown is available for this season.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Competition</th>
                        <th className="px-3 py-3 font-medium">Club</th>
                        <th className="px-3 py-3 text-right font-medium">Apps</th>
                        <th className="px-3 py-3 text-right font-medium">Min</th>
                        <th className="px-3 py-3 text-right font-medium">Goals</th>
                        <th className="px-3 py-3 text-right font-medium">Assists</th>
                        <th className="px-3 py-3 text-right font-medium">YC</th>
                        <th className="px-3 py-3 text-right font-medium">RC</th>
                        <th className="px-6 py-3 text-right font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSeason.competitions.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b text-foreground last:border-0"
                        >
                          <td className="px-6 py-3 font-medium">{row.competition}</td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {row.team}
                          </td>
                          <td className="px-3 py-3 text-right">{row.appearances}</td>
                          <td className="px-3 py-3 text-right">{row.minutes}</td>
                          <td className="px-3 py-3 text-right">{row.goals}</td>
                          <td className="px-3 py-3 text-right">{row.assists}</td>
                          <td className="px-3 py-3 text-right">{row.yellowCards}</td>
                          <td className="px-3 py-3 text-right">{row.redCards}</td>
                          <td className="px-6 py-3 text-right">{row.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
