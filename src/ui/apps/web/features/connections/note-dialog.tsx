"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type NoteDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  confirmVariant?: "default" | "outline" | "destructive";
  onConfirm: (message: string) => Promise<void> | void;
};

/** Small modal for an optional note attached to a connection action (send, accept, reject). */
export function NoteDialog({
  open,
  onClose,
  title,
  description,
  placeholder = "Add an optional note...",
  confirmLabel,
  confirmVariant = "default",
  onConfirm,
}: NoteDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setMessage("");
    }
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(message.trim());
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={placeholder}
              maxLength={1000}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                disabled={isSubmitting}
                onClick={() => void handleConfirm()}
              >
                {isSubmitting ? "Sending..." : confirmLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
