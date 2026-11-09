"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

const statusTabs = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "repair", label: "For Repair" },
  { value: "disposed", label: "Disposed" },
];

export function AssetFilterBar({ offices }: { offices: Tables<"offices">[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const office = searchParams.get("office") ?? "all";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={status === tab.value ? "default" : "outline"}
            className={cn("rounded-full")}
            onClick={() => setParam("status", tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search asset, code..."
            className="w-56 pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setParam("q", e.currentTarget.value);
              }
            }}
          />
        </div>
        <Select value={office} onValueChange={(value) => setParam("office", value)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.office_id} value={o.office_id.toString()}>
                {o.office_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
