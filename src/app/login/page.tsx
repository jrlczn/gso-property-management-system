import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteLogo } from "@/components/site-logo";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", true)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <SiteLogo
              logoUrl={siteSettings?.logo_url}
              className="h-12 w-12 text-foreground"
            />
          </Link>
          <div>
            <CardTitle className="text-xl">GSO-PMS</CardTitle>
            <p className="text-sm font-medium text-muted-foreground">Sign In</p>
          </div>
          <CardDescription className="text-center">
            Property Management System for the General Services Office,
            LGU Villanueva. Authorized personnel only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Back to homepage
      </Link>
    </div>
  );
}
