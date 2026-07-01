import { cn } from "@/lib/utils";

type ExchangeLogoMarkProps = {
  className?: string;
  title?: string;
};

type ExchangeLogoLockupProps = {
  className?: string;
  /** Retained for backwards-compat with callers; the new text lockup has no icon mark. */
  markClassName?: string;
  textClassName?: string;
  suffix?: string;
  suffixClassName?: string;
};

/** Small green rising-trend arrow that sits after the "UP" — matches the landing logo. */
function LogoArrow({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("ml-[2px] inline-block h-[0.82em] w-[0.82em] -translate-y-[0.06em]", className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <polyline points="3,17 9.5,11 13.5,14 21,5.5" stroke="#43a047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="21,5.5 14.6,5.7 21,12.1" fill="#43a047" />
      </svg>
    </span>
  );
}

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
        stroke="#16284a"
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 191 186 L 243 134 L 295 186"
      />
      <rect x="207" y="206" width="72" height="142" rx="11" fill="#16284a" />
      <path
        fill="#16284a"
        stroke="#16284a"
        strokeWidth="18"
        strokeLinejoin="round"
        d="M 243 166 L 295 214 L 191 214 Z"
      />
      <rect x="146" y="294" width="44" height="54" rx="9" fill="#43a047" />
      <path
        fill="#43a047"
        stroke="#43a047"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 168 254 L 204 290 L 132 290 Z"
      />
      <rect x="296" y="294" width="44" height="54" rx="9" fill="#43a047" />
      <path
        fill="#43a047"
        stroke="#43a047"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 318 254 L 354 290 L 282 290 Z"
      />
    </svg>
  );
}

/**
 * Text wordmark: "1031Exchange" + green "UP" + rising arrow — matches the
 * landing page nav. Colour is inherited (currentColor) so callers set it on the
 * wrapper: navy on light surfaces, white on the navy footer. Weight/size come
 * from textClassName.
 */
export function ExchangeLogoLockup({
  className,
  textClassName,
  suffix,
  suffixClassName,
}: ExchangeLogoLockupProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center whitespace-nowrap font-extrabold leading-none tracking-[-0.01em]",
        textClassName,
        className,
      )}
    >
      <span>1031Exchange</span>
      <span className="text-[#43a047]">UP</span>
      <LogoArrow />
      {suffix ? <span className={suffixClassName}>{suffix}</span> : null}
    </span>
  );
}
