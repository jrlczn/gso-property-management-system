import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { StickerCopiesControl } from "@/components/sticker-copies-control";
import { createClient } from "@/lib/supabase/server";
import { generateQrDataUrl } from "@/lib/qrcode";

export default async function AssetStickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ copies?: string }>;
}) {
  const { id } = await params;
  const { copies } = await searchParams;
  const supabase = await createClient();

  const [{ data: asset }, { data: latestAssignment }] = await Promise.all([
    supabase
      .from("assets")
      .select("asset_code, asset_name")
      .eq("asset_id", Number(id))
      .single(),
    supabase
      .from("asset_assignments")
      .select(
        "status, accountable_officers(first_name, last_name), offices(office_name)",
      )
      .eq("asset_id", Number(id))
      .order("assigned_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!asset) notFound();

  const qrDataUrl = await generateQrDataUrl(asset.asset_code);
  const count = Math.min(Math.max(Number(copies) || 1, 1), 24);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 print:hidden">
        <Link href={`/dashboard/assets/${id}`}>
          <ArrowLeft className="h-4 w-4" /> Back to Asset
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Printable Asset Sticker
          </h1>
          <p className="text-sm text-muted-foreground">
            Print, cut along the border, and affix to the physical asset.
          </p>
          {latestAssignment && latestAssignment.status !== "returned" ? (
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Currently issued to{" "}
              {latestAssignment.accountable_officers
                ? `${latestAssignment.accountable_officers.first_name} ${latestAssignment.accountable_officers.last_name}`
                : "an officer"}
              {latestAssignment.offices
                ? `, ${latestAssignment.offices.office_name}`
                : ""}
              .
            </p>
          ) : (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Not yet assigned. If you know who&apos;s receiving this asset,
              consider issuing it first from Movement &amp; Issuance &mdash;
              you can print this same sticker from that record afterward.
            </p>
          )}
        </div>
        <div className="flex items-end gap-2">
          <StickerCopiesControl defaultCount={count} />
          <PrintButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex h-[1in] w-[2.5in] items-center gap-2 border border-dashed border-foreground/40 p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="h-[0.85in] w-[0.85in] shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide">
                GSO-PMS &middot; Villanueva
              </p>
              <p className="truncate text-xs font-bold">{asset.asset_code}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {asset.asset_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
