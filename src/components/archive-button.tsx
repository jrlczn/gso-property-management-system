"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ArchiveResult = {
  success?: boolean;
  error?: string;
};

type ArchiveButtonProps = {
  action: () => Promise<ArchiveResult>;
  confirmMessage?: string;
  showLabel?: boolean;
};

export function ArchiveButton({
  action,
  confirmMessage = "Are you sure you want to archive this transaction?",
  showLabel = false,
}: ArchiveButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleArchive() {
    if (isPending) return;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setIsPending(true);

    try {
      const result = await action();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("Transaction archived successfully.");
      }
    } catch {
      toast.error("Failed to archive transaction.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      title="Archive transaction"
      aria-label="Archive transaction"
      onClick={handleArchive}
      disabled={isPending}
    >
      <Archive className="h-4 w-4" />
      {showLabel && (
        <span className="ml-2">
          {isPending ? "Archiving..." : "Archive"}
        </span>
      )}
    </Button>
  );
}