"use client";

import { useActionState, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOfficer, updateOfficer } from "@/app/dashboard/officers/actions";
import { ImageUploadField } from "@/components/image-upload-field";
import type { Tables } from "@/lib/supabase/database.types";

type Office = Tables<"offices">;
type Officer = Tables<"accountable_officers">;

export function OfficerFormDialog({
  offices,
  officer,
  trigger,
}: {
  offices: Office[];
  officer?: Officer;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = officer
    ? updateOfficer.bind(null, officer.officer_id)
    : createOfficer;
  const [state, formAction, isPending] = useActionState(action, null);

  useFormSuccessEffect(
    state,
    officer ? "Officer updated." : "Officer added.",
    () => setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Add Officer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {officer ? "Edit Accountable Officer" : "Add Accountable Officer"}
          </DialogTitle>
          <DialogDescription>
            Personnel responsible for assigned government property.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <ImageUploadField
            bucket="officer-photos"
            pathPrefix="officers"
            name="photo_url"
            label="Photo"
            currentUrl={officer?.photo_url}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                required
                defaultValue={officer?.first_name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                defaultValue={officer?.last_name}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee_no">Employee No.</Label>
              <Input
                id="employee_no"
                name="employee_no"
                defaultValue={officer?.employee_no ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                defaultValue={officer?.position ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_id">Office / Department</Label>
            <Select name="office_id" defaultValue={officer?.office_id?.toString()}>
              <SelectTrigger id="office_id" className="w-full">
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.office_id} value={office.office_id.toString()}>
                    {office.office_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_no">Contact Number</Label>
              <Input
                id="contact_no"
                name="contact_no"
                defaultValue={officer?.contact_no ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={officer?.email ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={officer?.status ?? "active"}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state && "error" in state && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Officer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
