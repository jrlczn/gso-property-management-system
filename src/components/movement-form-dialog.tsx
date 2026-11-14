
"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";

import { useFormSuccessEffect } from "@/hooks/use-form-success";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createMovement,
  updateMovement,
} from "@/app/dashboard/movements/actions";

import type { Tables } from "@/lib/supabase/database.types";
import { todayIso } from "@/lib/format";

type Asset = Tables<"assets">;
type Officer = Tables<"accountable_officers">;
type Office = Tables<"offices">;
type Assignment = Tables<"asset_assignments">;

type DocumentType = "par" | "ics";

export function MovementFormDialog({
  assets,
  officers,
  offices,
  assignment,
  documentType,
  trigger,
}: {
  assets: Asset[];
  officers: Officer[];
  offices: Office[];
  assignment?: Assignment;
  documentType?: DocumentType;
  trigger?: ReactNode;
}) {
  const isEditing = !!assignment;

  const [open, setOpen] = useState(false);

  const [status, setStatus] = useState<string>(
    assignment?.status ?? "issued"
  );

  const [officeId, setOfficeId] = useState(
    assignment?.office_id?.toString() ?? ""
  );

  const [officerId, setOfficerId] = useState(
    assignment?.officer_id?.toString() ?? ""
  );

  const [docType, setDocType] = useState<DocumentType>(
    documentType ?? "par"
  );

  const action = isEditing
    ? updateMovement.bind(null, assignment.assignment_id)
    : createMovement;

  const [state, formAction, isPending] = useActionState(
    action,
    null
  );

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next && !isEditing) {
      setOfficeId("");
      setOfficerId("");
      setStatus("issued");
      setDocType("par");
    }
  }

  function handleOfficeChange(next: string) {
    setOfficeId(next);
    setOfficerId("");
  }

  useFormSuccessEffect(
    state,
    isEditing ? "Movement updated successfully." : "Transaction recorded.",
    () => handleOpenChange(false)
  );

  const needsDocument =
    isEditing ||
    status === "issued" ||
    status === "transferred";

  const officersInOffice = officeId
    ? officers
        .filter(
          (officer) =>
            officer.office_id?.toString() === officeId
        )
        .sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          )
        )
    : [];

  const officerPlaceholder = !officeId
    ? "Select department first"
    : officersInOffice.length === 0
      ? "No officers in this department"
      : "Select officer";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            New Issuance / Return
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Asset Movement" : "New Asset Movement"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the existing movement and its PAR/ICS document type."
              : "Record an issuance, return, or transfer of a government asset."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Transaction Type</Label>

              <Select
                name="status"
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_date">Date</Label>

              <Input
                id="assigned_date"
                name="assigned_date"
                type="date"
                required
                defaultValue={
                  assignment?.assigned_date ?? todayIso()
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset_id">Asset</Label>

            <Select
              name="asset_id"
              required
              defaultValue={assignment?.asset_id.toString()}
            >
              <SelectTrigger id="asset_id" className="w-full">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>

              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem
                    key={asset.asset_id}
                    value={asset.asset_id.toString()}
                  >
                    {asset.asset_code} · {asset.asset_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="office_id">
                {status === "returned"
                  ? "Returned From"
                  : "To Department"}
              </Label>

              <Select
                name="office_id"
                value={officeId}
                onValueChange={handleOfficeChange}
              >
                <SelectTrigger id="office_id" className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>

                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem
                      key={office.office_id}
                      value={office.office_id.toString()}
                    >
                      {office.office_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="officer_id">
                Accountable Officer
              </Label>

              <Select
                name="officer_id"
                value={officerId}
                onValueChange={setOfficerId}
                disabled={officersInOffice.length === 0}
              >
                <SelectTrigger id="officer_id" className="w-full">
                  <SelectValue placeholder={officerPlaceholder} />
                </SelectTrigger>

                <SelectContent>
                  {officersInOffice.map((officer) => (
                    <SelectItem
                      key={officer.officer_id}
                      value={officer.officer_id.toString()}
                    >
                      {officer.first_name} {officer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsDocument && (
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="doc_type">
                Generate Document
              </Label>

              <Select
                name="doc_type"
                value={docType}
                onValueChange={(value) =>
                  setDocType(value as DocumentType)
                }
              >
                <SelectTrigger
                  id="doc_type"
                  className="w-full"
                >
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="par">
                    PAR (Property Acknowledgement Receipt)
                  </SelectItem>

                  <SelectItem value="ics">
                    ICS (Inventory Custodian Slip)
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Select the correct document type for this asset.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>

            <Textarea
              id="remarks"
              name="remarks"
              rows={2}
              defaultValue={assignment?.remarks ?? ""}
            />
          </div>

          {state && "error" in state && (
            <p
              className="text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update Movement"
                  : "Save Transaction"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
