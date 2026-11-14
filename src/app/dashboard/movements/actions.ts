
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
    return {
      error: error?.message ?? "Failed to record transaction.",
    };
  }

  // Update asset custody.
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

  // Generate PAR or ICS.
  if (
    (status === "issued" || status === "transferred") &&
    docType &&
    officerId
  ) {
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

// DELETE MOVEMENT
export async function deleteMovement(
  assignmentId: number,
): Promise<{ success?: boolean; error?: string }> {
  await requireUser();

  const supabase = await createClient();

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    return { error: "Invalid transaction ID." };
  }

  // Check linked PAR.
  const { data: par, error: parError } = await supabase
    .from("par_records")
    .select("par_id")
    .eq("assignment_id", assignmentId)
    .limit(1)
    .maybeSingle();

  if (parError) {
    return { error: parError.message };
  }

  // Check linked ICS.
  const { data: ics, error: icsError } = await supabase
    .from("ics_records")
    .select("ics_id")
    .eq("assignment_id", assignmentId)
    .limit(1)
    .maybeSingle();

  if (icsError) {
    return { error: icsError.message };
  }

  // Protect official documents.
  if (par || ics) {
    return {
      error:
        "Cannot delete this transaction because it is linked to an official PAR/ICS record.",
    };
  }

  // Find the selected transaction.
  const { data: assignment, error: assignmentError } = await supabase
    .from("asset_assignments")
    .select("asset_id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return {
      error: assignmentError?.message ?? "Transaction not found.",
    };
  }

  // Delete selected transaction.
  const { error: deleteError } = await supabase
    .from("asset_assignments")
    .delete()
    .eq("assignment_id", assignmentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Find the latest remaining movement.
  const { data: latestMovement, error: latestError } = await supabase
    .from("asset_assignments")
    .select("office_id, status")
    .eq("asset_id", assignment.asset_id)
    .order("assigned_date", { ascending: false })
    .order("assignment_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return {
      error: `Transaction deleted, but failed to retrieve latest movement: ${latestError.message}`,
    };
  }

  const assignedOfficeId =
    latestMovement?.status === "returned"
      ? null
      : latestMovement?.office_id ?? null;

  // Synchronize asset custody.
  const { error: custodyError } = await supabase
    .from("assets")
    .update({ assigned_office_id: assignedOfficeId })
    .eq("asset_id", assignment.asset_id);

  if (custodyError) {
    return {
      error: `Transaction deleted, but failed to update asset custody: ${custodyError.message}`,
    };
  }

  revalidatePath("/dashboard/movements");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard");

  return { success: true };
}
