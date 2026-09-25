import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: "default" | "primary";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={cn(
            "mb-3 flex size-10 items-center justify-center rounded-xl",
            tone === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-5" />
        </div>
        <p className="break-words text-xl font-semibold leading-tight text-foreground sm:text-2xl">
          {value}
        </p>
        <p className="mt-1 break-words text-sm leading-tight text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
