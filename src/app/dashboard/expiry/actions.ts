"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/format";

/** Scans all active assets for approaching warranty / useful-life / maintenance
 * thresholds and creates a pending alert for each one that doesn't already have
 * one. Safe to run repeatedly (idempotent per asset + alert type). */
export async function generateAlerts() {
  await requireUser();
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "asset_id, asset_name, expiration_date, warranty_expiry, next_service_date, expiry_alert_days_before, warranty_alert_days_before, maintenance_alert_days_before",
    )
    .neq("status", "disposed");

  if (!assets) return { created: 0 };

  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("asset_id, alert_type")
    .eq("status", "pending");

  const existingKey = new Set(
    (existingAlerts ?? []).map((a) => `${a.asset_id}:${a.alert_type}`),
  );

  const toInsert: {
    asset_id: number;
    alert_type: "warranty" | "useful_life" | "maintenance";
    alert_message: string;
    alert_date: string;
  }[] = [];

  const today = new Date().toISOString().slice(0, 10);

  for (const asset of assets) {
    const checks: {
      type: "warranty" | "useful_life" | "maintenance";
      date: string | null;
      label: string;
      threshold: number;
    }[] = [
      {
        type: "warranty",
        date: asset.warranty_expiry,
        label: "Warranty expires",
        threshold: asset.warranty_alert_days_before ?? 30,
      },
      {
        type: "useful_life",
        date: asset.expiration_date,
        label: "Useful life ends",
        threshold: asset.expiry_alert_days_before ?? 30,
      },
      {
        type: "maintenance",
        date: asset.next_service_date,
        label: "Maintenance due",
        threshold: asset.maintenance_alert_days_before ?? 30,
      },
    ];

    for (const check of checks) {
      if (!check.date) continue;
      const remaining = daysUntil(check.date);
      if (remaining === null || remaining > check.threshold) continue;

      const key = `${asset.asset_id}:${check.type}`;
      if (existingKey.has(key)) continue;

      const message =
        remaining < 0
          ? `${check.label} — overdue by ${Math.abs(remaining)} day(s)`
          : `${check.label} in ${remaining} day(s)`;

      toInsert.push({
        asset_id: asset.asset_id,
        alert_type: check.type,
        alert_message: `${asset.asset_name}: ${message}`,
        alert_date: today,
      });
      existingKey.add(key);
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("alerts").insert(toInsert);
    if (insertError) return { created: 0, error: insertError.message };
  }

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/expiry");
  revalidatePath("/dashboard");
  return { created: toInsert.length };
}
