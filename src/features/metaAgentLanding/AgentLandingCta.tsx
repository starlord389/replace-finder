import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const AGENT_LANDING_CTA = "Find My Client’s Replacement Property";

type AgentLandingCtaProps = {
  destination: string;
  location: "header" | "hero" | "story" | "final";
  onClick: (location: AgentLandingCtaProps["location"]) => void;
  compact?: boolean;
  className?: string;
  label?: string;
};

export function AgentLandingCta({
  destination,
  location,
  onClick,
  compact = false,
  className,
  label,
}: AgentLandingCtaProps) {
  const visibleLabel = label ?? (compact ? "Start a free search" : AGENT_LANDING_CTA);

  return (
    <Link
      to={destination}
      onClick={() => onClick(location)}
      data-cta-location={location}
      aria-label={visibleLabel === AGENT_LANDING_CTA ? undefined : AGENT_LANDING_CTA}
      className={cn(
        "agent-primary-cta group inline-flex min-h-12 items-center justify-center rounded-lg bg-[#43a047] font-bold text-white shadow-[0_14px_40px_rgba(31,104,45,0.24)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#368b3b] hover:shadow-[0_18px_46px_rgba(31,104,45,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bdda1] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none",
        compact
          ? "whitespace-nowrap px-5 py-2 text-center text-sm leading-none"
          : "w-full gap-2 px-5 py-3.5 text-center text-[14px] leading-5 sm:w-auto sm:px-7 sm:text-[15px]",
        className,
      )}
    >
      <span>{visibleLabel}</span>
      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}
