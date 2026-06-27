"use client";

import type { AdminUserListItem } from "@globalscout/shared";
import { Ban, ShieldOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

type UserRowActionsProps = {
  user: AdminUserListItem;
  currentUserId: string;
  disabled?: boolean;
  onBlock: (userId: string) => Promise<void>;
  onUnblock: (userId: string) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
};

export function UserRowActions({
  user,
  currentUserId,
  disabled = false,
  onBlock,
  onUnblock,
  onDelete,
}: UserRowActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSelf = user.id === currentUserId;
  const isBlocked = user.status === "BLOCKED";

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground">Current account</span>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {isBlocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => void onUnblock(user.id)}
          >
            <ShieldOff className="size-3.5" />
            Unblock
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => void onBlock(user.id)}
          >
            <Ban className="size-3.5" />
            Block
          </Button>
        )}

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={disabled}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete user?"
        description={`This permanently removes ${user.email} and all associated data. This cannot be undone.`}
        confirmLabel="Delete user"
        destructive
        loading={disabled}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void onDelete(user.id).finally(() => setConfirmDelete(false));
        }}
      />
    </>
  );
}
