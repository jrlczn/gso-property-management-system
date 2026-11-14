
"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/hooks/use-form-success";

type DocumentType = "par" | "ics";

function refreshMovementPages() {
  revalidatePath("/dashboard/movements");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard");
}

function makeDocumentNumber(
  type: DocumentType,
  date: string,
  id: number,
) {
  const year = new Date(`${date}T00:00:00`).getFullYear();

  return `${type.toUpperCase()}-${year}-${String(id).padStart(4, "0")}`;
}

function makeConvertedDocumentNumber(
  type: DocumentType,
  date: string,
  oldNumber: string,
  fallbackId: number,
) {
  const year = new Date(`${date}T00:00:00`).getFullYear();
  const match = oldNumber.match(/-(\d+)$/);

  const sequence = match
    ? match[1]
    : String(fallbackId).padStart(4, "0");

  return `${type.toUpperCase()}-${year}-${sequence}`;
}

// CREATE MOVEMENT
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
  const docType = formData.get("doc_type") as DocumentType | "";

  if (
    !Number.isInteger(assetId) ||
    assetId <= 0 ||
    !assignedDate ||
    !["issued", "returned", "transferred"].includes(status)
  ) {
    return { error: "Please provide valid movement information." };
  }

  if (
    (status === "issued" || status === "transferred") &&
    (!docType || !["par", "ics"].includes(docType) || !officerId)
  ) {
    return {
      error: "Please select a PAR/ICS document type and accountable officer.",
    };
  }

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

  if (
    (status === "issued" || status === "transferred") &&
    docType &&
    officerId
  ) {
    const documentNumber = makeDocumentNumber(
      docType,
      assignedDate,
      assignment.assignment_id,
    );

    const { error: docError } =
      docType === "par"
        ? await supabase.from("par_records").insert({
            par_no: documentNumber,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignment.assignment_id,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          })
        : await supabase.from("ics_records").insert({
            ics_no: documentNumber,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignment.assignment_id,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          });

    if (docError) {
      return {
        error: `Movement recorded, but failed to generate ${docType.toUpperCase()}: ${docError.message}`,
      };
    }
  }

  refreshMovementPages();

  return { success: true };
}

// UPDATE EXISTING MOVEMENT AND PAR/ICS DOCUMENT
export async function updateMovement(
  assignmentId: number,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await requireUser();
  const supabase = await createClient();

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    return { error: "Invalid movement ID." };
  }

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
  const docType = formData.get("doc_type") as DocumentType | "";

  if (
    !Number.isInteger(assetId) ||
    assetId <= 0 ||
    !assignedDate ||
    !["issued", "returned", "transferred"].includes(status)
  ) {
    return { error: "Please provide valid movement information." };
  }

  const needsDocument =
    status === "issued" || status === "transferred";

  if (
    needsDocument &&
    (!docType || !["par", "ics"].includes(docType) || !officerId)
  ) {
    return {
      error: "Please select a PAR/ICS document type and accountable officer.",
    };
  }

  // Find existing movement.
  const { data: existing, error: existingError } = await supabase
    .from("asset_assignments")
    .select("asset_id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      error: existingError?.message ?? "Movement record not found.",
    };
  }

  // Find linked PAR and ICS.
  const [
    { data: par, error: parError },
    { data: ics, error: icsError },
  ] = await Promise.all([
    supabase
      .from("par_records")
      .select("par_id, par_no")
      .eq("assignment_id", assignmentId)
      .maybeSingle(),

    supabase
      .from("ics_records")
      .select("ics_id, ics_no")
      .eq("assignment_id", assignmentId)
      .maybeSingle(),
  ]);

  if (parError || icsError) {
    return {
      error:
        parError?.message ??
        icsError?.message ??
        "Failed to retrieve documents.",
    };
  }

  if (par && ics) {
    return {
      error: "This movement has both PAR and ICS records. Please check the records first.",
    };
  }

  if ((par || ics) && status === "returned") {
    return {
      error:
        "This movement has an official PAR/ICS document. Record the return as a new movement instead.",
    };
  }

  // Preserve original document number sequence.
  const oldDocumentNumber = par?.par_no ?? ics?.ics_no ?? "";

  const newDocumentNumber =
    needsDocument && docType
      ? oldDocumentNumber
        ? makeConvertedDocumentNumber(
            docType,
            assignedDate,
            oldDocumentNumber,
            assignmentId,
          )
        : makeDocumentNumber(docType, assignedDate, assignmentId)
      : "";

  // Update existing movement. Do not insert a new movement.
  const { error: movementError } = await supabase
    .from("asset_assignments")
    .update({
      asset_id: assetId,
      officer_id: officerId,
      office_id: officeId,
      status,
      assigned_date: assignedDate,
      returned_date: status === "returned" ? assignedDate : null,
      remarks,
    })
    .eq("assignment_id", assignmentId);

  if (movementError) {
    return { error: movementError.message };
  }

  // Existing PAR -> Update PAR.
  if (par && docType === "par") {
    const { error } = await supabase
      .from("par_records")
      .update({
        par_no: newDocumentNumber,
        asset_id: assetId,
        officer_id: officerId,
        issue_date: assignedDate,
        remarks,
      })
      .eq("assignment_id", assignmentId);

    if (error) {
      return { error: `Failed to update PAR: ${error.message}` };
    }
  }

  // Existing ICS -> Update ICS.
  else if (ics && docType === "ics") {
    const { error } = await supabase
      .from("ics_records")
      .update({
        ics_no: newDocumentNumber,
        asset_id: assetId,
        officer_id: officerId,
        issue_date: assignedDate,
        remarks,
      })
      .eq("assignment_id", assignmentId);

    if (error) {
      return { error: `Failed to update ICS: ${error.message}` };
    }
  }

  // Convert PAR -> ICS.
  else if (par && docType === "ics" && officerId) {
    const { error: insertError } = await supabase
      .from("ics_records")
      .insert({
        ics_no: newDocumentNumber,
        asset_id: assetId,
        officer_id: officerId,
        assignment_id: assignmentId,
        issue_date: assignedDate,
        remarks,
        issued_by: profile.id,
      });

    if (insertError) {
      return {
        error: `Failed to convert PAR to ICS: ${insertError.message}`,
      };
    }

    const { error: deleteError } = await supabase
      .from("par_records")
      .delete()
      .eq("assignment_id", assignmentId);

    if (deleteError) {
      return {
        error: `ICS created, but old PAR could not be removed: ${deleteError.message}`,
      };
    }
  }

  // Convert ICS -> PAR.
  else if (ics && docType === "par" && officerId) {
    const { error: insertError } = await supabase
      .from("par_records")
      .insert({
        par_no: newDocumentNumber,
        asset_id: assetId,
        officer_id: officerId,
        assignment_id: assignmentId,
        issue_date: assignedDate,
        remarks,
        issued_by: profile.id,
      });

    if (insertError) {
      return {
        error: `Failed to convert ICS to PAR: ${insertError.message}`,
      };
    }

    const { error: deleteError } = await supabase
      .from("ics_records")
      .delete()
      .eq("assignment_id", assignmentId);

    if (deleteError) {
      return {
        error: `PAR created, but old ICS could not be removed: ${deleteError.message}`,
      };
    }
  }

  // Generate document if none exists.
  else if (!par && !ics && needsDocument && docType && officerId) {
    const { error } =
      docType === "par"
        ? await supabase.from("par_records").insert({
            par_no: newDocumentNumber,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignmentId,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          })
        : await supabase.from("ics_records").insert({
            ics_no: newDocumentNumber,
            asset_id: assetId,
            officer_id: officerId,
            assignment_id: assignmentId,
            issue_date: assignedDate,
            remarks,
            issued_by: profile.id,
          });

    if (error) {
      return {
        error: `Movement updated, but document generation failed: ${error.message}`,
      };
    }
  }

  // Recalculate custody of old and new assets.
  const affectedAssetIds = Array.from(
    new Set([existing.asset_id, assetId]),
  );

  for (const affectedAssetId of affectedAssetIds) {
    const { data: latest, error: latestError } = await supabase
      .from("asset_assignments")
      .select("office_id, status")
      .eq("asset_id", affectedAssetId)
      .order("assigned_date", { ascending: false })
      .order("assignment_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      return { error: latestError.message };
    }

    const assignedOfficeId =
      latest?.status === "returned"
        ? null
        : latest?.office_id ?? null;

    const { error: custodyError } = await supabase
      .from("assets")
      .update({ assigned_office_id: assignedOfficeId })
      .eq("asset_id", affectedAssetId);

    if (custodyError) {
      return { error: custodyError.message };
    }
  }

  refreshMovementPages();

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

  const [
    { data: par, error: parError },
    { data: ics, error: icsError },
  ] = await Promise.all([
    supabase
      .from("par_records")
      .select("par_id")
      .eq("assignment_id", assignmentId)
      .maybeSingle(),

    supabase
      .from("ics_records")
      .select("ics_id")
      .eq("assignment_id", assignmentId)
      .maybeSingle(),
  ]);

  if (parError || icsError) {
    return {
      error:
        parError?.message ??
        icsError?.message ??
        "Failed to check documents.",
    };
  }

  if (par || ics) {
    return {
      error:
        "Cannot delete this transaction because it is linked to an official PAR/ICS record.",
    };
  }

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

  const { error: deleteError } = await supabase
    .from("asset_assignments")
    .delete()
    .eq("assignment_id", assignmentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { data: latestMovement, error: latestError } = await supabase
    .from("asset_assignments")
    .select("office_id, status")
    .eq("asset_id", assignment.asset_id)
    .order("assigned_date", { ascending: false })
    .order("assignment_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return { error: latestError.message };
  }

  const assignedOfficeId =
    latestMovement?.status === "returned"
      ? null
      : latestMovement?.office_id ?? null;

  const { error: custodyError } = await supabase
    .from("assets")
    .update({ assigned_office_id: assignedOfficeId })
    .eq("asset_id", assignment.asset_id);

  if (custodyError) {
    return { error: custodyError.message };
  }

  refreshMovementPages();

  return { success: true };
}
