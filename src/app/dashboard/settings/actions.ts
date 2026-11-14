"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blockedMessage, deleteErrorMessage } from "@/lib/delete-messages";
import type { FormActionState } from "@/hooks/use-form-success";

export async function createStaffAccount(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to .env.local (get it from Supabase Dashboard > Project Settings > API Keys) to enable account creation.",
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  // Only an explicit "admin" selection creates an admin; anything else is staff.
  const role: "admin" | "staff" =
    formData.get("role") === "admin" ? "admin" : "staff";

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !created.user) {
    return { error: error?.message ?? "The account could not be created." };
  }

  // The database trigger (handle_new_user) always creates a new profile as
  // 'staff' by design, so the role picked in the form is applied here as a
  // separate step. This runs with the service-role client, and the action is
  // already restricted to admins by requireAdmin() above.
  if (role === "admin") {
    const { data: updated, error: roleError } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", created.user.id)
      .select("id");

    if (roleError || !updated?.length) {
      // Roll back, so an account is never left behind with the wrong role.
      await admin.auth.admin.deleteUser(created.user.id);
      return {
        error:
          roleError?.message ??
          "The account could not be set up as an administrator. Please try again.",
      };
    }
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "admin" | "staff") {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "inactive",
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function deleteUserAccount(userId: string) {
  const me = await requireAdmin();
  if (me.id === userId) {
    return { error: "You can't delete the account you are logged in with." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to .env.local (get it from Supabase Dashboard > Project Settings > API Keys) to enable account deletion.",
    };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const label = target?.full_name || target?.email || "This account";

  // Every PAR / ICS keeps the name of the user who issued it, so an account
  // that issued any cannot be removed - it can only be deactivated.
  const [par, ics] = await Promise.all([
    supabase
      .from("par_records")
      .select("*", { count: "exact", head: true })
      .eq("issued_by", userId),
    supabase
      .from("ics_records")
      .select("*", { count: "exact", head: true })
      .eq("issued_by", userId),
  ]);
  const issued = (par.count ?? 0) + (ics.count ?? 0);
  if (issued > 0) {
    return {
      error: `"${label}" can't be deleted because this account issued ${issued} PAR/ICS ${issued === 1 ? "record" : "records"}, and those must stay on file. Use Deactivate instead to stop this account from logging in.`,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return {
      error: `"${label}" could not be deleted (${error.message}). Use Deactivate instead if you only need to stop this account from logging in.`,
    };
  }

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function createCategory(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").insert({
    category_name: formData.get("category_name") as string,
    description: (formData.get("description") as string) || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteCategory(categoryId: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("category_name")
    .eq("category_id", categoryId)
    .maybeSingle();
  const label = category?.category_name ?? "This category";
  const advice = "Change those assets to another category first.";

  const assets = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  const blocked = blockedMessage(
    label,
    [{ count: assets.count, singular: "asset", plural: "assets" }],
    advice,
  );
  if (blocked) return { error: blocked };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("category_id", categoryId);
  if (error) return { error: deleteErrorMessage(error, label, advice) };

  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function createOffice(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("offices").insert({
    office_name: formData.get("office_name") as string,
    office_head: (formData.get("office_head") as string) || null,
    location: (formData.get("location") as string) || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteOffice(officeId: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: office } = await supabase
    .from("offices")
    .select("office_name")
    .eq("office_id", officeId)
    .maybeSingle();
  const label = office?.office_name ?? "This department";
  const advice =
    "Move those officers and assets to another department first. Movement history is kept permanently, so a department that appears in past movements cannot be deleted.";

  const [officers, assets, movements] = await Promise.all([
    supabase
      .from("accountable_officers")
      .select("*", { count: "exact", head: true })
      .eq("office_id", officeId),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("assigned_office_id", officeId),
    supabase
      .from("asset_assignments")
      .select("*", { count: "exact", head: true })
      .eq("office_id", officeId),
  ]);

  const blocked = blockedMessage(
    label,
    [
      { count: officers.count, singular: "officer", plural: "officers" },
      { count: assets.count, singular: "asset", plural: "assets" },
      {
        count: movements.count,
        singular: "movement record",
        plural: "movement records",
      },
    ],
    advice,
  );
  if (blocked) return { error: blocked };

  const { error } = await supabase.from("offices").delete().eq("office_id", officeId);
  if (error) return { error: deleteErrorMessage(error, label, advice) };

  revalidatePath("/dashboard/settings");
  return undefined;
}

function parseTeamMemberForm(formData: FormData) {
  return {
    name: formData.get("name") as string,
    year_level: formData.get("year_level") as string,
    course: formData.get("course") as string,
    age: Number(formData.get("age")),
    sex: formData.get("sex") as string,
    address: formData.get("address") as string,
    contact_number: formData.get("contact_number") as string,
    email: formData.get("email") as string,
    future_summary: formData.get("future_summary") as string,
    photo_url: (formData.get("photo_url") as string) || null,
    sort_order: Number(formData.get("sort_order")) || 0,
  };
}

export async function createTeamMember(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("team_members").insert(parseTeamMemberForm(formData));
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateTeamMember(
  id: number,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_members")
    .update(parseTeamMemberForm(formData))
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTeamMember(id: number) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  return undefined;
}

export async function updateSiteBranding(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const logoUrl = (formData.get("logo_url") as string) || null;
  const faviconUrl = (formData.get("favicon_url") as string) || null;

  const { error } = await supabase
    .from("site_settings")
    .update({ logo_url: logoUrl, favicon_url: faviconUrl, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: error.message };

  updateTag("site-settings");
  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true };
}
