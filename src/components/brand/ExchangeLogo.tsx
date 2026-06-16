import { cn } from "@/lib/utils";

type ExchangeLogoMarkProps = {
  className?: string;
  title?: string;
};

type ExchangeLogoLockupProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  suffix?: string;
  suffixClassName?: string;
};

export function ExchangeLogoMark({ className, title }: ExchangeLogoMarkProps) {
  const titleId = title ? "exchange-logo-title" : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="118 118 250 240"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role={title ? "img" : undefined}
      aria-labelledby={titleId}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fill="none"
        stroke="#000000"
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 191 186 L 243 134 L 295 186"
      />
      <rect x="278" y="142" width="15" height="34" rx="6" fill="#000000" />
      <rect x="207" y="206" width="72" height="142" rx="11" fill="#000000" />
      <path
        fill="#000000"
        stroke="#000000"
        strokeWidth="18"
        strokeLinejoin="round"
        d="M 243 166 L 295 214 L 191 214 Z"
      />
      <rect x="146" y="294" width="44" height="54" rx="9" fill="#FECD1A" />
      <path
        fill="#FECD1A"
        stroke="#FECD1A"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 168 254 L 204 290 L 132 290 Z"
      />
      <rect x="296" y="294" width="44" height="54" rx="9" fill="#FECD1A" />
      <path
        fill="#FECD1A"
        stroke="#FECD1A"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 318 254 L 354 290 L 282 290 Z"
      />
    </svg>
  );
}

export function ExchangeLogoLockup({
  className,
  markClassName,
  textClassName,
  suffix,
  suffixClassName,
}: ExchangeLogoLockupProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <ExchangeLogoMark className={cn("h-8 w-auto shrink-0", markClassName)} />
      <span className={cn("whitespace-nowrap text-[14px] font-semibold tracking-[-0.02em] text-[#1d1d1d]", textClassName)}>
        1031 Exchange Up
      </span>
      {suffix ? (
        <span className={suffixClassName}>
          {suffix}
        </span>
      ) : null}
    </span>
  );
}