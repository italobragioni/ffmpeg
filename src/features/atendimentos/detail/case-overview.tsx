import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatTimeRange } from "@/lib/format";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/constants";
import type { FuneralCase } from "@/types";

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasContent = Array.isArray(items) ? items.length > 0 : !!items;
  if (!hasContent) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">{children}</dl>
      </CardContent>
    </Card>
  );
}

export function CaseOverview({
  funeralCase: c,
  roomName,
}: {
  funeralCase: FuneralCase;
  roomName?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Section title="Falecido">
        <Detail label="Nome" value={c.deceased_name} />
        <Detail label="Cidade" value={c.death_city} />
        <Detail label="Nascimento" value={c.birth_date ? formatDate(c.birth_date) : null} />
        <Detail
          label="Falecimento"
          value={
            c.death_date
              ? `${formatDate(c.death_date)}${c.death_time ? ` às ${c.death_time.slice(0, 5)}` : ""}`
              : null
          }
        />
        <Detail label="Observações" value={c.deceased_notes} />
      </Section>

      <Section title="Família / Responsável">
        <Detail label="Responsável" value={c.family_name} />
        <Detail label="Parentesco" value={c.family_relationship} />
        <Detail label="Telefone" value={c.family_phone} />
        <Detail label="WhatsApp" value={c.family_whatsapp} />
        <Detail label="E-mail" value={c.family_email} />
      </Section>

      <Section title="Remoção">
        <Detail label="Local" value={c.removal_place} />
        <Detail label="Endereço" value={c.removal_address} />
        <Detail
          label="Data e horário"
          value={
            c.removal_date
              ? `${formatDate(c.removal_date)}${c.removal_time ? ` às ${c.removal_time.slice(0, 5)}` : ""}`
              : null
          }
        />
        <Detail label="Responsável" value={c.removal_responsible} />
        <Detail label="Observações" value={c.removal_notes} />
      </Section>

      <Section title="Serviço">
        <Detail
          label="Tipo"
          value={c.service_type ? SERVICE_TYPE_LABELS[c.service_type as ServiceType] : null}
        />
        <Detail label="Local do velório" value={c.wake_place} />
        <Detail label="Sala / capela" value={roomName} />
        <Detail
          label="Velório"
          value={c.wake_start ? `${formatDate(c.wake_start)} · ${formatTimeRange(c.wake_start, c.wake_end)}` : null}
        />
        <Detail label="Local final" value={c.final_place} />
        <Detail
          label="Sepultamento / cremação"
          value={c.final_datetime ? formatDateTime(c.final_datetime) : null}
        />
      </Section>

      <Section title="Detalhes">
        <Detail label="Urna" value={c.urn} />
        <Detail label="Ornamentação" value={c.ornamentation} />
        <Detail label="Veículo" value={c.vehicle} />
        <Detail label="Observações internas" value={c.internal_notes} />
      </Section>
    </div>
  );
}
