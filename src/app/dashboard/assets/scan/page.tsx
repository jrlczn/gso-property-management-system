import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetScanner } from "@/components/asset-scanner";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/assets">
          <ArrowLeft className="h-4 w-4" /> Back to Registry
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan to Verify</h1>
        <p className="text-sm text-muted-foreground">
          Scan an asset&apos;s QR tag during physical count to instantly
          verify its recorded status and location.
        </p>
      </div>

      <AssetScanner />
    </div>
  );
}
