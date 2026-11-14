"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { blockedMessage, deleteErrorMessage } from "@/lib/delete-messages";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { FormActionState } from "@/hooks/use-form-success";

function parseOfficerForm(formData: FormData): TablesInsert<"accountable_officers"> {
  const str = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  const officeId = formData.get("office_id");
  return {
    employee_no: str("employee_no"),
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    position: str("position"),
    office_id: officeId ? Number(officeId) : null,
    contact_no: str("contact_no"),
    email: str("email"),
    photo_url: str("photo_url"),
    status: (formData.get("status") as string) || "active",
  };
}

export async function createOfficer(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  const parsed = parseOfficerForm(formData);
  if (!parsed.photo_url) {
    return { error: "A photo is required so the office can identify the custodian on sight." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accountable_officers").insert(parsed);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/officers");
  return { success: true };
}

export async function updateOfficer(
  officerId: number,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  const parsed = parseOfficerForm(formData);
  if (!parsed.photo_url) {
    return { error: "A photo is required so the office can identify the custodian on sight." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accountable_officers")
    .update(parsed)
    .eq("officer_id", officerId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/officers");
  return { success: true };
}

export async function deleteOfficer(officerId: number) {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Only administrators can delete accountable officers." };
  }

  const supabase = await createClient();

  const { data: officer } = await supabase
    .from("accountable_officers")
    .select("first_name, last_name")
    .eq("officer_id", officerId)
    .maybeSingle();
  const label = officer
    ? `${officer.first_name} ${officer.last_name}`
    : "This officer";
  const advice =
    "Their issuance history must be kept, so set the officer's Status to Inactive instead (Officers > Edit). Inactive officers no longer appear when issuing assets.";

  const [movements, par, ics] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select("*", { count: "exact", head: true })
      .eq("officer_id", officerId),
    supabase
      .from("par_records")
      .select("*", { count: "exact", head: true })
      .eq("officer_id", officerId),
    supabase
      .from("ics_records")
      .select("*", { count: "exact", head: true })
      .eq("officer_id", officerId),
  ]);

  const blocked = blockedMessage(
    label,
    [
      {
        count: movements.count,
        singular: "movement record",
        plural: "movement records",
      },
      { count: par.count, singular: "PAR record", plural: "PAR records" },
      { count: ics.count, singular: "ICS record", plural: "ICS records" },
    ],
    advice,
  );
  if (blocked) return { error: blocked };

  const { error } = await supabase
    .from("accountable_officers")
    .delete()
    .eq("officer_id", officerId);

  if (error) return { error: deleteErrorMessage(error, label, advice) };

  revalidatePath("/dashboard/officers");
  return undefined;
}
