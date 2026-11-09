"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";

export function ReportCategoryFilter({
  categories,
}: {
  categories: Tables<"categories">[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("category_id") ?? "all";

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete("category_id");
    } else {
      params.set("category_id", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={categoryId} onValueChange={setCategory}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.category_id} value={c.category_id.toString()}>
            {c.category_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
