import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamMemberCard } from "@/components/team-member-card";
import { SiteLogo } from "@/components/site-logo";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: teamMembers }, { data: siteSettings }] = await Promise.all([
    supabase.from("team_members").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("logo_url").eq("id", true).maybeSingle(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <SiteLogo logoUrl={siteSettings?.logo_url} className="h-5 w-5 text-primary" />
            <span>GSO-PMS</span>
          </div>
          <Button asChild size="sm">
            <Link href="/login">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            General Services Office &middot; LGU Villanueva
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Property Management System
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            A cloud-based system for recording, monitoring, and reporting on
            government-owned non-consumable property &mdash; built for the
            General Services Office of the Municipality of Villanueva.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Sign in to the system <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-36 right-1/4 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-sky-600 uppercase">
                The Roster
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Meet the Developers
              </h2>
              <p className="mt-3 text-muted-foreground">
                BS Information Technology capstone project &middot; University
                of Science and Technology of Southern Philippines, Villanueva
                Campus
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers?.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          {`© ${new Date().getFullYear()} GSO-PMS · Department of Information Technology, USTP Villanueva Campus`}
        </div>
      </footer>
    </div>
  );
}
