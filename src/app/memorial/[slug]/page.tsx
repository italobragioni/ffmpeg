import { notFound } from "next/navigation";
import { MapPin, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/brand/logo";
import { TributeForm } from "@/features/memorial/tribute-form";
import { formatDateLong, formatTime, formatTimeRange } from "@/lib/format";
import { hexToHsl, mapsLink } from "@/lib/utils";

interface MemorialData {
  deceased_name: string;
  birth_year: number | null;
  death_year: number | null;
  epitaph: string | null;
  org_name: string;
  org_logo: string | null;
  primary_color: string | null;
  show_wake: boolean;
  wake_start: string | null;
  wake_end: string | null;
  wake_place: string | null;
  wake_room: string | null;
  show_final: boolean;
  service_type: string | null;
  final_datetime: string | null;
  final_place: string | null;
}

interface Tribute {
  author_name: string;
  body: string;
  created_at: string;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_public_memorial", { p_slug: params.slug });
  const m = (data as MemorialData[])?.[0];
  return {
    title: m ? `${m.deceased_name} — Memorial` : "Memorial",
    description: m?.epitaph ?? undefined,
    robots: { index: false },
  };
}

export default async function MemorialPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const [{ data: memorialData }, { data: tributesData }] = await Promise.all([
    supabase.rpc("get_public_memorial", { p_slug: params.slug }),
    supabase.rpc("get_public_tributes", { p_slug: params.slug }),
  ]);

  const m = (memorialData as MemorialData[])?.[0];
  if (!m) notFound();
  const tributes = (tributesData as Tribute[]) ?? [];
  const primary = hexToHsl(m.primary_color);

  return (
    <div
      className="min-h-screen bg-background"
      style={primary ? ({ "--primary": primary } as React.CSSProperties) : undefined}
    >
      {/* Header */}
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
          {m.org_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.org_logo} alt={m.org_name} className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-primary">
              <LogoMark className="size-8" />
            </span>
          )}
          <span className="font-medium text-foreground">{m.org_name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* In memoriam */}
        <section className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Em memória de</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {m.deceased_name}
          </h1>
          {(m.birth_year || m.death_year) && (
            <p className="mt-2 text-lg text-muted-foreground">
              {m.birth_year ?? ""} — {m.death_year ?? ""}
            </p>
          )}
          {m.epitaph && (
            <p className="mx-auto mt-6 max-w-md text-balance text-muted-foreground">
              “{m.epitaph}”
            </p>
          )}
        </section>

        {/* Ceremony details */}
        <section className="mt-10 space-y-4">
          {m.show_wake && m.wake_start && (
            <CeremonyCard
              title="Velório"
              date={formatDateLong(m.wake_start)}
              time={formatTimeRange(m.wake_start, m.wake_end)}
              place={[m.wake_place, m.wake_room].filter(Boolean).join(" — ")}
              mapQuery={[m.wake_place, m.wake_room].filter(Boolean).join(" ")}
            />
          )}
          {m.show_final && m.final_datetime && (
            <CeremonyCard
              title={m.service_type === "cremation" ? "Cremação" : "Sepultamento"}
              date={formatDateLong(m.final_datetime)}
              time={formatTime(m.final_datetime)}
              place={m.final_place ?? ""}
              mapQuery={m.final_place ?? ""}
            />
          )}
        </section>

        {/* Tributes */}
        <section className="mt-12">
          <h2 className="text-center text-lg font-semibold text-foreground">Deixe uma homenagem</h2>
          <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
            Sua mensagem será revisada antes de ser publicada.
          </p>
          <TributeForm slug={params.slug} />

          {tributes.length > 0 && (
            <div className="mt-8 space-y-3">
              {tributes.map((t, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-foreground">{t.body}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">— {t.author_name}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-primary">
            <LogoMark className="size-4" />
          </span>
          Página criada com SOLENE
        </div>
      </footer>
    </div>
  );
}

function CeremonyCard({
  title,
  date,
  time,
  place,
  mapQuery,
}: {
  title: string;
  date: string;
  time: string;
  place: string;
  mapQuery: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h3>
      <p className="mt-3 text-lg font-medium text-foreground">{date}</p>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-muted-foreground">
        <Clock className="size-4" /> {time}
      </p>
      {place && <p className="mt-2 text-foreground">{place}</p>}
      {mapQuery && (
        <a
          href={mapsLink(mapQuery)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <MapPin className="size-4" /> Como chegar
        </a>
      )}
    </div>
  );
}
