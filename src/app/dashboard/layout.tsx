import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  const supabase = await createClient();
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", true)
    .maybeSingle();

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <AppSidebar profile={profile} logoUrl={siteSettings?.logo_url ?? null} />
      </div>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            Property Management System
          </span>
        </header>
        <div className="flex-1 space-y-6 p-6 print:p-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
