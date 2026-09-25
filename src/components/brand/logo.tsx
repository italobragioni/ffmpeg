import { cn } from "@/lib/utils";

/**
 * SOLENE mark — an abstract symbol suggesting shelter / continuity / care
 * (an open arc cradling a rising dot). Deliberately non-religious and calm.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <path
        d="M6 20c0-5.523 4.477-10 10-10s10 4.477 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="19" r="3" fill="currentColor" />
      <path
        d="M11 25.5c1.4 1 3.1 1.5 5 1.5s3.6-.5 5-1.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function Logo({
  className,
  showTagline = false,
  size = "md",
}: {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";
  const mark = size === "lg" ? "size-9" : size === "sm" ? "size-6" : "size-8";
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <LogoMark className={mark} />
      <div className="flex flex-col leading-none">
        <span className={cn("font-semibold tracking-tight", text)}>SOLENE</span>
        {showTagline && (
          <span className="mt-1 text-xs font-normal text-muted-foreground">
            Gestão funerária simples e organizada.
          </span>
        )}
      </div>
    </div>
  );
}
