"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompetitionLevel, CompetitionType } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";
import {
  CompetitionLevelSelectItems,
  CompetitionLevelSelectValueLabel,
} from "@/components/reference-data/competition-level-select-items";
import {
  CompetitionTypeSelectItems,
  CompetitionTypeSelectValueLabel,
} from "@/components/reference-data/competition-type-select-items";
import { formatCompetitionLevelDescription } from "@/lib/reference-data/competition-levels";
import { formatCompetitionTypeDescription } from "@/lib/reference-data/competition-types";

type SubmitEntryDialogProps = {
  open: boolean;
  onClose: () => void;
  country: string;
  kind: "team" | "competition";
  onSubmitted: (entry: { id: string; name: string }) => void;
};

export function SubmitEntryDialog({
  open,
  onClose,
  country,
  kind,
  onSubmitted,
}: SubmitEntryDialogProps) {
  const [name, setName] = useState("");
  const [levelHint, setLevelHint] = useState<CompetitionLevel>("Amateur");
  const [typeHint, setTypeHint] = useState<CompetitionType>("League");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const api = createBrowserReferenceDataApi();
      const result =
        kind === "team"
          ? await api.submitTeam({ country, name: trimmed })
          : await api.submitCompetition({
              country,
              name: trimmed,
              levelHint,
              typeHint,
            });

      onSubmitted({ id: result.id, name: result.name });
      setName("");
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit entry",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    kind === "team" ? "Submit a club" : "Submit a competition";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            We&apos;ll review your submission. You can use it immediately while
            it&apos;s pending (limit: 5 pending submissions).
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submit-entry-name">Name</Label>
              <Input
                id="submit-entry-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder={
                  kind === "team" ? "e.g. FC Voluntari U19" : "e.g. Liga Elitelor"
                }
                disabled={isSubmitting}
              />
            </div>

            {kind === "competition" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="submit-entry-type">Competition type</Label>
                  <Select
                    value={typeHint}
                    onValueChange={(value) =>
                      setTypeHint(value as CompetitionType)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="submit-entry-type" className="w-full">
                      <SelectValue>
                        <CompetitionTypeSelectValueLabel type={typeHint} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <CompetitionTypeSelectItems />
                    </SelectContent>
                  </Select>
                  {formatCompetitionTypeDescription(typeHint) ? (
                    <p className="text-xs text-muted-foreground">
                      {formatCompetitionTypeDescription(typeHint)}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submit-entry-level">Competition level</Label>
                  <Select
                    value={levelHint}
                    onValueChange={(value) =>
                      setLevelHint(value as CompetitionLevel)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="submit-entry-level" className="w-full">
                      <SelectValue>
                        <CompetitionLevelSelectValueLabel level={levelHint} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <CompetitionLevelSelectItems />
                    </SelectContent>
                  </Select>
                  {formatCompetitionLevelDescription(levelHint) ? (
                    <p className="text-xs text-muted-foreground">
                      {formatCompetitionLevelDescription(levelHint)}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
