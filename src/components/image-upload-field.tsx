"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { compressToWebp } from "@/lib/image-compress";
import { createClient } from "@/lib/supabase/client";

export function ImageUploadField({
  bucket,
  pathPrefix,
  name,
  label,
  currentUrl,
  required,
  clearable,
  shape = "circle",
  maxDimension = 512,
}: {
  bucket: string;
  pathPrefix: string;
  /** Field name for the hidden input so this participates in a normal <form action> submit. */
  name: string;
  label: string;
  currentUrl?: string | null;
  required?: boolean;
  /** Shows a "Remove" control that clears the value back to empty (falls back to default). */
  clearable?: boolean;
  shape?: "circle" | "square";
  maxDimension?: number;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      const webp = await compressToWebp(file, maxDimension);
      const supabase = createClient();
      const path = `${pathPrefix}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from(bucket).upload(path, webp, {
        contentType: "image/webp",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      toast.error("Upload failed. Try a smaller image or a different file.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted",
            shape === "circle" ? "rounded-full" : "rounded-lg",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {url ? "Change photo" : "Upload photo"}
            </Button>
            {clearable && url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={() => setUrl("")}
              >
                <X className="h-4 w-4" /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Compressed to WebP automatically.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {/* Carries the uploaded URL along with the rest of the form's native submit.
          Validation for `required` happens server-side: a hidden input can't
          show the browser's native validation bubble, so enforcing it here
          would just throw "not focusable" instead of a useful message. */}
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
