import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteLogo({
  logoUrl,
  className,
}: {
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="GSO-PMS" className={cn("object-contain", className)} />;
  }
  return <Boxes className={className} />;
}
