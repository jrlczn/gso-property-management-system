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
import { createDisposal } from "@/app/dashboard/disposal/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { todayIso } from "@/lib/format";

type Asset = Tables<"assets">;

export function DisposalFormDialog({ assets }: { assets: Asset[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createDisposal, null);

  useFormSuccessEffect(state, "Disposal recorded.", () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Initiate Disposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Asset Disposal</DialogTitle>
          <DialogDescription>
            Manage condemned or disposed government assets. This marks the
            asset as disposed and removes it from active circulation.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset_id">Asset</Label>
            <Select name="asset_id" required>
              <SelectTrigger id="asset_id" className="w-full">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.asset_id} value={asset.asset_id.toString()}>
                    {asset.asset_code} &middot; {asset.asset_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="disposal_date">Disposal Date</Label>
              <Input
                id="disposal_date"
                name="disposal_date"
                type="date"
                required
                defaultValue={todayIso()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disposal_method">Method</Label>
              <Select name="disposal_method" defaultValue="Auction" required>
                <SelectTrigger id="disposal_method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auction">Auction</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Write-off">Write-off</SelectItem>
                  <SelectItem value="Condemnation">Condemnation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appraisal_value">Appraisal Value (₱)</Label>
              <Input
                id="appraisal_value"
                name="appraisal_value"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspection_date">Inspection Date</Label>
              <Input id="inspection_date" name="inspection_date" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approved_by">Approved By</Label>
            <Input
              id="approved_by"
              name="approved_by"
              placeholder="e.g. Mayor Juan V."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Reason / Remarks</Label>
            <Textarea id="remarks" name="remarks" rows={2} />
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
              {isPending ? "Saving..." : "Save Disposal Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
