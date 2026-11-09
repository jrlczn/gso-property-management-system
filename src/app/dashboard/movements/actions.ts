"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/hooks/use-form-success";

export async function createMovement(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await requireUser();
  const supabase = await createClient();

  const assetId = Number(formData.get("asset_id"));
  const officerId = formData.get("officer_id")
    ? Number(formData.get("officer_id"))
    : null;
  const officeId = formData.get("office_id")
    ? Number(formData.get("office_id"))
    : null;
  const status = formData.get("status") as "issued" | "returned" | "transferred";
  const assignedDate = formData.get("assigned_date") as string;
  const remarks = (formData.get("remarks") as string) || null;
  const docType = formData.get("doc_type") as "par" | "ics" | "";

  const { data: assignment, error } = await supabase
    .from("asset_assignments")
    .insert({
      asset_id: assetId,
      officer_id: officerId,
      office_id: officeId,
      status,
      assigned_date: assignedDate,
      returned_date: status === "returned" ? assignedDate : null,
      remarks,
    })
    .select("assignment_id")
    .single();

  if (error || !assignment) {
    return { error: error?.message ?? "Failed to record transaction." };
  }

  // Keep the asset's current custody in sync with the latest movement.
  const { error: custodyError } = await supabase
    .from("assets")
    .update({ assigned_office_id: status === "returned" ? null : officeId })
    .eq("asset_id", assetId);

  if (custodyError) {
    return {
      error: `Movement recorded, but failed to update asset custody: ${custodyError.message}`,
    };
  }

  if ((status === "issued" || status === "transferred") && docType && officerId) {
    const year = new Date(assignedDate).getFullYear();
    const { error: docError } =
      docType === "par"
        ? await supabase.from("par_records").insert({
            par_no: `PAR-${year}-${String(assignment.assignment_id).padStart(4, "0")}`,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignment.assignment_id,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          })
        : await supabase.from("ics_records").insert({
            ics_no: `ICS-${year}-${String(assignment.assignment_id).padStart(4, "0")}`,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignment.assignment_id,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          });

    if (docError) {
      return {
        error: `Movement recorded, but failed to generate the ${docType.toUpperCase()}: ${docError.message}`,
      };
    }
  }

  revalidatePath("/dashboard/movements");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard");
  return { success: true };
}
