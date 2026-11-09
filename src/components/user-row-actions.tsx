"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateUserRole, updateUserStatus } from "@/app/dashboard/settings/actions";

export function UserRowActions({
  userId,
  role,
  status,
  isSelf,
}: {
  userId: string;
  role: string;
  status: string;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function changeRole(next: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, next as "admin" | "staff");
      if (result?.error) toast.error(result.error);
      else toast.success("Role updated.");
    });
  }

  function toggleStatus() {
    startTransition(async () => {
      const next = status === "active" ? "inactive" : "active";
      const result = await updateUserStatus(userId, next);
      if (result?.error) toast.error(result.error);
      else toast.success(next === "active" ? "Account reactivated." : "Account deactivated.");
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Select value={role} onValueChange={changeRole} disabled={isSelf || isPending}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={isSelf || isPending}
        onClick={toggleStatus}
      >
        {status === "active" ? "Deactivate" : "Reactivate"}
      </Button>
    </div>
  );
}
