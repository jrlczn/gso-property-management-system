"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { FormActionState } from "@/hooks/use-form-success";

export type AssetFormState = FormActionState;

function parseAssetForm(formData: FormData): TablesInsert<"assets"> {
  const num = (key: string) => {
    const value = formData.get(key);
    return value ? Number(value) : null;
  };
  const str = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  return {
    asset_code: formData.get("asset_code") as string,
    asset_name: formData.get("asset_name") as string,
    category_id: num("category_id"),
    description: str("description"),
    brand: str("brand"),
    model: str("model"),
    serial_number: str("serial_number"),
    acquisition_date: formData.get("acquisition_date") as string,
    acquisition_cost: num("acquisition_cost") ?? 0,
    useful_life_years: num("useful_life_years") ?? 1,
    expiration_date: str("expiration_date"),
    warranty_expiry: str("warranty_expiry"),
    next_service_date: str("next_service_date"),
    expiry_alert_days_before: num("expiry_alert_days_before") ?? 30,
    warranty_alert_days_before: num("warranty_alert_days_before") ?? 30,
    maintenance_alert_days_before: num("maintenance_alert_days_before") ?? 30,
    assigned_office_id: num("assigned_office_id"),
    remarks: str("remarks"),
  };
}

export async function createAsset(
  _prevState: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("assets").insert(parseAssetForm(formData));

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAsset(
  assetId: number,
  _prevState: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("assets")
    .update(parseAssetForm(formData))
    .eq("asset_id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAsset(assetId: number) {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Only administrators can delete assets." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("asset_id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  return undefined;
}
