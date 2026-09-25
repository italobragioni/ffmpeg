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
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tone === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-5" />
          </div>
          <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        </div>
        <p className="mt-2 break-words text-sm leading-tight text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
