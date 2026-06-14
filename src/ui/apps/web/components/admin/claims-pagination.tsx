"use client";

import type { PaginationDto } from "@globalscout/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClaimsPaginationProps = {
  pagination: PaginationDto;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function ClaimsPagination({
  pagination,
  disabled = false,
  onPageChange,
}: ClaimsPaginationProps) {
  const { page, pages, total, limit } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} claim{total === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="min-w-24 text-center text-sm text-muted-foreground">
          Page {page} of {Math.max(pages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pages === 0 || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
