import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_STYLES,
  type CaseStatus,
} from "@/lib/constants";

export function StatusBadge({
  status,
  className,
}: {
  status: CaseStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(CASE_STATUS_STYLES[status], className)}>
      {CASE_STATUS_LABELS[status]}
    </Badge>
  );
}
