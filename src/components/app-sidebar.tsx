"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";
import { logout } from "@/app/dashboard/actions";

type Profile = Tables<"profiles">;

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/assets", label: "Property Assets", icon: Boxes },
  { href: "/dashboard/expiry", label: "Expiry Tracker", icon: Clock },
  {
    href: "/dashboard/movements",
    label: "Movement & Issuance",
    icon: ArrowLeftRight,
  },
  { href: "/dashboard/disposal", label: "Disposal & Write-off", icon: Trash2 },
];

const managementNav = [
  { href: "/dashboard/officers", label: "Accountable Officers", icon: Users },
  { href: "/dashboard/records", label: "PAR/ICS Records", icon: FileText },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof mainNav;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                }
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({
  profile,
  logoUrl,
}: {
  profile: Profile;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const initials = (profile.full_name ?? profile.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <SiteLogo
            logoUrl={logoUrl}
            className="h-5 w-5 shrink-0 text-sidebar-primary"
          />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">GSO-PMS</span>
            <span className="text-xs text-sidebar-foreground/60">
              Municipality of Villanueva
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Main" items={mainNav} pathname={pathname} />
        <NavGroup label="Management" items={managementNav} pathname={pathname} />
        {profile.role === "admin" && (
          <NavGroup
            label="System"
            items={[
              { href: "/dashboard/settings", label: "Settings", icon: Settings },
            ]}
            pathname={pathname}
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">
            {initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">
              {profile.full_name ?? profile.email}
            </span>
            <span className="text-xs capitalize text-sidebar-foreground/60">
              {profile.role}
            </span>
          </div>
          <form action={logout} className="group-data-[collapsible=icon]:hidden">
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
