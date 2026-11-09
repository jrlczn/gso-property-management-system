import Image from "next/image";
import { UserRound } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";

type TeamMember = Tables<"team_members">;

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className="truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function TeamMemberCard({ member }: { member: TeamMember }) {
  const roster = String(member.sort_order).padStart(2, "0");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-sky-100 hover:bg-white/85 hover:shadow-xl">
      <span
        aria-hidden
        className="absolute top-2 left-3 z-10 font-mono text-5xl font-black text-slate-300 drop-shadow-[0_2px_2px_rgba(15,23,42,0.15)] select-none transition-colors duration-300 group-hover:text-slate-400 sm:text-6xl"
      >
        {roster}
      </span>

      <div className="relative aspect-[3/4] w-full px-4 pt-4">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            className="object-contain object-bottom p-4 drop-shadow-[0_14px_20px_rgba(15,23,42,0.15)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-end gap-2 pb-6 text-muted-foreground/60">
            <UserRound className="h-16 w-16" strokeWidth={1} />
            <span className="text-xs">Photo coming soon</span>
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-3 px-5 pb-5">
        <div>
          <div className="h-0.5 w-10 bg-sky-500 transition-all duration-300 group-hover:w-16" />
          <h3 className="mt-2 text-lg leading-tight font-black tracking-tight text-foreground uppercase">
            {member.name}
          </h3>
          <p className="text-xs font-medium text-sky-600">{member.course}</p>
        </div>

        <div>
          <StatRow label="Year Level" value={member.year_level} />
          <StatRow label="Age" value={member.age} />
          <StatRow label="Sex" value={member.sex} />
          <StatRow label="Address" value={member.address} />
          <StatRow label="Contact Number" value={member.contact_number} />
          <StatRow label="Email Address" value={member.email} />
        </div>

        <blockquote className="border-l-2 border-sky-500/50 pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            5 Years From Now
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/80 italic">
            &ldquo;{member.future_summary}&rdquo;
          </p>
        </blockquote>
      </div>
    </div>
  );
}
