"use client";

import { useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

type ClaimAction = "approve" | "reject" | "request-info";

type ClaimActionFormProps = {
  disabled?: boolean;
  onApprove: (note?: string | null) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onRequestInfo: (note: string) => Promise<void>;
};

const actionConfig = {
  approve: {
    label: "Approve",
    description: "Optional note for internal records.",
    noteRequired: false,
    buttonVariant: "default" as const,
    icon: CheckCircle2,
  },
  reject: {
    label: "Reject",
    description: "Explain why this claim is being rejected.",
    noteRequired: true,
    buttonVariant: "destructive" as const,
    icon: XCircle,
  },
  "request-info": {
    label: "Request more info",
    description: "Tell the player what additional evidence is needed.",
    noteRequired: true,
    buttonVariant: "outline" as const,
    icon: Info,
  },
} as const;

export function ClaimActionForm({
  disabled = false,
  onApprove,
  onReject,
  onRequestInfo,
}: ClaimActionFormProps) {
  const [activeAction, setActiveAction] = useState<ClaimAction | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!activeAction) {
      return;
    }

    const config = actionConfig[activeAction];
    const trimmedNote = note.trim();

    if (config.noteRequired && !trimmedNote) {
      setError("A note is required for this action.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (activeAction === "approve") {
        await onApprove(trimmedNote || null);
      } else if (activeAction === "reject") {
        await onReject(trimmedNote);
      } else {
        await onRequestInfo(trimmedNote);
      }

      setActiveAction(null);
      setNote("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Action failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(actionConfig) as ClaimAction[]).map((action) => {
          const config = actionConfig[action];
          const Icon = config.icon;
          const isActive = activeAction === action;

          return (
            <Button
              key={action}
              type="button"
              size="sm"
              variant={isActive ? config.buttonVariant : "outline"}
              disabled={disabled || isSubmitting}
              onClick={() => {
                setActiveAction(action);
                setError(null);
              }}
            >
              <Icon className="size-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {activeAction ? (
        <FieldGroup className="rounded-xl border bg-muted/20 p-4">
          <Field>
            <FieldLabel htmlFor="admin-note">
              {actionConfig[activeAction].noteRequired
                ? "Admin note"
                : "Admin note (optional)"}
            </FieldLabel>
            <FieldDescription>
              {actionConfig[activeAction].description}
            </FieldDescription>
            <textarea
              id="admin-note"
              rows={4}
              value={note}
              disabled={disabled || isSubmitting}
              onChange={(event) => setNote(event.target.value)}
              className={cn(
                "mt-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors",
                "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              placeholder="Add review notes..."
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={actionConfig[activeAction].buttonVariant}
              disabled={disabled || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? "Submitting..."
                : `Confirm ${actionConfig[activeAction].label.toLowerCase()}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => {
                setActiveAction(null);
                setNote("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </FieldGroup>
      ) : null}
    </div>
  );
}
