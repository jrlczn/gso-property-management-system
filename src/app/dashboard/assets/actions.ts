
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

  const status = formData.get("status") as
    | "issued"
    | "returned"
    | "transferred";

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

  const { error: custodyError } = await supabase
    .from("assets")
    .update({
      assigned_office_id: status === "returned" ? null : officeId,
    })
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

// EDIT MOVEMENT
export async function updateMovement(
  assignmentId: number,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const supabase = await createClient();

  const officerId = formData.get("officer_id")
    ? Number(formData.get("officer_id"))
    : null;

  const officeId = formData.get("office_id")
    ? Number(formData.get("office_id"))
    : null;

  const status = formData.get("status") as
    | "issued"
    | "returned"
    | "transferred";

  const assignedDate = formData.get("assigned_date") as string;
  const remarks = (formData.get("remarks") as string) || null;

  const { data: existing, error: fetchError } = await supabase
    .from("asset_assignments")
    .select("assignment_id, asset_id")
    .eq("assignment_id", assignmentId)
    .single();

  if (fetchError || !existing) {
    return { error: "Movement record not found." };
  }

  const { error } = await supabase
    .from("asset_assignments")
    .update({
      officer_id: officerId,
      office_id: officeId,
      status,
      assigned_date: assignedDate,
      returned_date: status === "returned" ? assignedDate : null,
      remarks,
    })
    .eq("assignment_id", assignmentId);

  if (error) {
    return { error: error.message };
  }

  // Get latest movement to determine current asset custody.
  const { data: latestMovement, error: latestError } = await supabase
    .from("asset_assignments")
    .select("status, office_id")
    .eq("asset_id", existing.asset_id)
    .order("assigned_date", { ascending: false })
    .order("assignment_id", { ascending: false })
    .limit(1)
    .single();

  if (latestError || !latestMovement) {
    return { error: "Movement updated, but custody could not be recalculated." };
  }

  const { error: custodyError } = await supabase
    .from("assets")
    .update({
      assigned_office_id:
        latestMovement.status === "returned"
          ? null
          : latestMovement.office_id,
    })
    .eq("asset_id", existing.asset_id);

  if (custodyError) {
    return { error: custodyError.message };
  }

  // Update existing PAR records.
  const { error: parError } = await supabase
    .from("par_records")
    .update({
      officer_id: officerId,
      issue_date: assignedDate,
      remarks,
    })
    .eq("assignment_id", assignmentId);

  if (parError) {
    return { error: `Failed to update PAR: ${parError.message}` };
  }

  // Update existing ICS records.
  const { error: icsError } = await supabase
    .from("ics_records")
    .update({
      officer_id: officerId,
      issue_date: assignedDate,
      remarks,
    })
    .eq("assignment_id", assignmentId);

  if (icsError) {
    return { error: `Failed to update ICS: ${icsError.message}` };
  }

  revalidatePath("/dashboard/movements");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard");

  return { success: true };
}
