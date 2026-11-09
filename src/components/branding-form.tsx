"use client";

import { useActionState } from "react";
import { useFormSuccessEffect } from "@/hooks/use-form-success";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/image-upload-field";
import { updateSiteBranding } from "@/app/dashboard/settings/actions";
import type { Tables } from "@/lib/supabase/database.types";

export function BrandingForm({ settings }: { settings: Tables<"site_settings"> | null }) {
  const [state, formAction, isPending] = useActionState(updateSiteBranding, null);

  useFormSuccessEffect(state, "Branding updated. It may take a moment to appear everywhere.", () => {});

  return (
    <form action={formAction} className="space-y-6">
      <ImageUploadField
        bucket="branding"
        pathPrefix="logo"
        name="logo_url"
        label="Site Logo"
        currentUrl={settings?.logo_url}
        shape="square"
        clearable
      />
      <ImageUploadField
        bucket="branding"
        pathPrefix="favicon"
        name="favicon_url"
        label="Favicon"
        currentUrl={settings?.favicon_url}
        shape="square"
        maxDimension={256}
        clearable
      />
      <p className="text-xs text-muted-foreground">
        Leave either field blank and save to fall back to the default GSO-PMS
        mark.
      </p>

      {state && "error" in state && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Branding"}
      </Button>
    </form>
  );
}
