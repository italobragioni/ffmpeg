import { CheckCircle2, Clock } from "lucide-react";

/** A calm, static preview of the SOLENE dashboard for the landing hero. */
export function AppPreview() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-lift">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Boa tarde,</p>
          <p className="font-semibold text-foreground">João</p>
        </div>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          Funerária Serenidade
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Hoje", value: "4" },
          { label: "Em andamento", value: "7" },
          { label: "Velórios", value: "2" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/60 p-3">
            <p className="text-lg font-semibold text-foreground">{s.value}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Próximos eventos</p>
        {[
          { time: "09:00", title: "Velório — Maria Aparecida", place: "Sala 02" },
          { time: "14:00", title: "Sepultamento — José Carlos", place: "Cemitério Municipal" },
        ].map((e) => (
          <div key={e.title} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
            <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
              <Clock className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.time} · {e.place}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Antônio Pereira</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            Velório
          </span>
        </div>
        <div className="space-y-1.5">
          {["Remoção confirmada", "Urna selecionada"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-success" /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
