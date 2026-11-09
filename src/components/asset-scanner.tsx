"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Search, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/client";

type FoundAsset = {
  asset_code: string;
  asset_name: string;
  status: string;
  categories: { category_name: string } | null;
  offices: { office_name: string } | null;
} | null;

export function AssetScanner() {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<FoundAsset>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function lookup(code: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("assets")
      .select("asset_code, asset_name, status, categories(category_name), offices:assigned_office_id(office_name)")
      .eq("asset_code", code)
      .maybeSingle();

    if (data) {
      setResult(data as FoundAsset);
      setNotFound(null);
    } else {
      setResult(null);
      setNotFound(code);
    }
  }

  async function startScan() {
    setCameraError(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScan();
          lookup(decodedText);
        },
        undefined,
      );
      setScanning(true);
    } catch {
      setCameraError(
        "Could not access a camera. Use the manual code entry below instead.",
      );
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // scanner already stopped
      }
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {!scanning ? (
              <Button onClick={startScan}>
                <Camera className="h-4 w-4" /> Start Camera Scan
              </Button>
            ) : (
              <Button variant="outline" onClick={stopScan}>
                <Square className="h-4 w-4" /> Stop Scan
              </Button>
            )}
          </div>

          {cameraError && (
            <p className="text-sm text-destructive">{cameraError}</p>
          )}

          <div id="qr-reader" className="mx-auto max-w-sm" />

          <div className="flex items-center gap-2 border-t border-border/60 pt-4">
            <Input
              placeholder="Or enter property code manually"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualCode) lookup(manualCode);
              }}
            />
            <Button variant="outline" onClick={() => manualCode && lookup(manualCode)}>
              <Search className="h-4 w-4" /> Look Up
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{result.asset_name}</p>
              <p className="text-sm text-muted-foreground">
                {result.asset_code} &middot; {result.categories?.category_name ?? "—"}{" "}
                &middot; {result.offices?.office_name ?? "Unassigned"}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card>
          <CardContent>
            <p className="text-sm text-destructive">
              No asset found with property code &quot;{notFound}&quot;.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
