"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/hooks/use-form-success";

export async function createDisposal(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const supabase = await createClient();

  const assetId = Number(formData.get("asset_id"));
  const appraisalValue = formData.get("appraisal_value");
  const inspectionDate = formData.get("inspection_date");

  const { data: asset, error: assetFetchError } = await supabase
    .from("assets")
    .select("status")
    .eq("asset_id", assetId)
    .single();

  if (assetFetchError || !asset) {
    return { error: assetFetchError?.message ?? "Asset not found." };
  }

  const { error } = await supabase.from("disposal").insert({
    asset_id: assetId,
    disposal_date: formData.get("disposal_date") as string,
    disposal_method: formData.get("disposal_method") as string,
    appraisal_value: appraisalValue ? Number(appraisalValue) : null,
    inspection_date: inspectionDate ? (inspectionDate as string) : null,
    approved_by: (formData.get("approved_by") as string) || null,
    remarks: (formData.get("remarks") as string) || null,
    status: "pending",
    previous_status: asset.status,
  });

  if (error) return { error: error.message };

  // Recording a disposal removes the asset from active circulation.
  const { error: statusError } = await supabase
    .from("assets")
    .update({ status: "disposed" })
    .eq("asset_id", assetId);

  if (statusError) return { error: statusError.message };

  revalidatePath("/dashboard/disposal");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markDisposalApproved(disposalId: number) {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Only administrators can approve disposal records." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("disposal")
    .update({ status: "approved" })
    .eq("disposal_id", disposalId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/disposal");
  return undefined;
}

/** Reverts an accidental approval back to "pending" — the disposal record
 * and the asset's "disposed" status are untouched, only the review state
 * changes. Distinct from revertDisposal, which undoes the whole disposal. */
export async function markDisposalPending(disposalId: number) {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Only administrators can change disposal status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("disposal")
    .update({ status: "pending" })
    .eq("disposal_id", disposalId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/disposal");
  return undefined;
}

/** Undoes a disposal: restores the asset to whatever status it had before
 * disposal (falling back to "active" for records created before this column
 * existed) and removes the disposal record. Admin-only, works for both
 * pending and already-approved disposals. */
export async function revertDisposal(disposalId: number) {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Only administrators can undo disposal records." };
  }

  const supabase = await createClient();

  const { data: disposal, error: fetchError } = await supabase
    .from("disposal")
    .select("asset_id, previous_status")
    .eq("disposal_id", disposalId)
    .single();

  if (fetchError || !disposal) {
    return { error: fetchError?.message ?? "Disposal record not found." };
  }

  const { error: assetError } = await supabase
    .from("assets")
    .update({ status: disposal.previous_status ?? "active" })
    .eq("asset_id", disposal.asset_id);

  if (assetError) return { error: assetError.message };

  const { error: deleteError } = await supabase
    .from("disposal")
    .delete()
    .eq("disposal_id", disposalId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/dashboard/disposal");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  return undefined;
}
