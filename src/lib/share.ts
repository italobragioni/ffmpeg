import { formatDate, formatTime, formatTimeRange } from "./format";
import type { FuneralCase } from "@/types";

/** Build the WhatsApp share message (section 16). */
export function buildShareMessage(c: FuneralCase, memorialUrl?: string): string {
  const lines: string[] = [`Informações sobre a despedida de ${c.deceased_name}.`, ""];

  if (c.wake_start) {
    lines.push("*Velório:*");
    lines.push(
      `${formatDate(c.wake_start)}, ${formatTimeRange(c.wake_start, c.wake_end)}`,
    );
    if (c.wake_place || c.wake_room_id) {
      lines.push([c.wake_place].filter(Boolean).join(" — "));
    }
    lines.push("");
  }

  if (c.final_datetime) {
    const label = c.service_type === "cremation" ? "Cremação" : "Sepultamento";
    lines.push(`*${label}:*`);
    lines.push(`${formatDate(c.final_datetime)} às ${formatTime(c.final_datetime)}`);
    if (c.final_place) lines.push(c.final_place);
    lines.push("");
  }

  if (memorialUrl) {
    lines.push("Confira as informações:");
    lines.push(memorialUrl);
  }

  return lines.join("\n").trim();
}
