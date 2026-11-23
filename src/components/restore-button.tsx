
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type RestoreResult = {
  success?: boolean;
  error?: string;
};

type RestoreButtonProps = {
  action: () => Promise<RestoreResult>;
};

export function RestoreButton({
  action,
}: RestoreButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleRestore() {
    if (isPending) return;

    const confirmed = window.confirm(
      "Are you sure you want to restore this archived transaction? It will appear again in the active Movement & Issuance list."
    );

    if (!confirmed) return;

    setIsPending(true);

    try {
      const result = await action();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("Transaction restored successfully.");
        router.refresh();
      }
    } catch {
      toast.error("Failed to restore transaction.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={isPending}
      title="Restore transaction"
    >
      <RotateCcw className="mr-2 h-4 w-4" />

      {isPending ? "Restoring..." : "Restore"}
    </Button>
  );
}
