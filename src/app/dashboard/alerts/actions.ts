"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";


export async function updateAlertStatus(
  alertId: number,
  status: "read" | "resolved",
) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({ status })
    .eq("alert_id", alertId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  return undefined;
}
