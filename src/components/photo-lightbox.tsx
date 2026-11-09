"use client";

import { User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PhotoLightbox({
  url,
  alt,
  shape = "circle",
  size = "h-10 w-10",
}: {
  url: string | null;
  alt: string;
  shape?: "circle" | "square";
  size?: string;
}) {
  const [open, setOpen] = useState(false);

  const thumb = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted",
        shape === "circle" ? "rounded-full" : "rounded-md",
        size,
        url && "cursor-pointer transition-opacity hover:opacity-80",
      )}
      onClick={() => url && setOpen(true)}
      role={url ? "button" : undefined}
      aria-label={url ? `View ${alt} photo` : undefined}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <User className="h-1/2 w-1/2 text-muted-foreground" />
      )}
    </div>
  );

  if (!url) return thumb;

  return (
    <>
      {thumb}
      {/* Radix Dialog already closes on outside click and Escape by default. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
