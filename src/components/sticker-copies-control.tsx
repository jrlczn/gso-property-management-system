"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function StickerCopiesControl({ defaultCount }: { defaultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultCount);

  return (
    <div className="flex items-end gap-2 print:hidden">
      <div className="space-y-1">
        <Label htmlFor="copies" className="text-xs">
          Copies
        </Label>
        <Input
          id="copies"
          type="number"
          min={1}
          max={24}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-20"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("copies", String(value));
          router.push(`?${params.toString()}`);
        }}
      >
        Update
      </Button>
    </div>
  );
}
