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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/image-upload-field";
import {
  createTeamMember,
  updateTeamMember,
} from "@/app/dashboard/settings/actions";
import type { Tables } from "@/lib/supabase/database.types";

type TeamMember = Tables<"team_members">;

export function TeamMemberFormDialog({
  member,
  nextSortOrder,
}: {
  member?: TeamMember;
  nextSortOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const action = member ? updateTeamMember.bind(null, member.id) : createTeamMember;
  const [state, formAction, isPending] = useActionState(action, null);

  useFormSuccessEffect(
    state,
    member ? "Team member updated." : "Team member added.",
    () => setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={member ? "ghost" : "outline"}>
          {!member && <Plus className="h-4 w-4" />}
          {member ? "Edit" : "Add Team Member"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription>
            Shown on the public homepage, in this field order.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <ImageUploadField
            bucket="team-photos"
            pathPrefix="team"
            name="photo_url"
            label="Photo"
            currentUrl={member?.photo_url}
            shape="square"
          />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={member?.name} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year_level">Year Level</Label>
              <Input
                id="year_level"
                name="year_level"
                required
                defaultValue={member?.year_level}
                placeholder="4th Year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                name="course"
                required
                defaultValue={member?.course}
                placeholder="BS Information Technology"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={1}
                required
                defaultValue={member?.age}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select name="sex" defaultValue={member?.sex ?? "Male"}>
                <SelectTrigger id="sex" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" required defaultValue={member?.address} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                name="contact_number"
                required
                defaultValue={member?.contact_number}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={member?.email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="future_summary">5 Years From Now</Label>
            <Textarea
              id="future_summary"
              name="future_summary"
              required
              rows={3}
              defaultValue={member?.future_summary}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Display Order</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={member?.sort_order ?? nextSortOrder}
            />
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
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
