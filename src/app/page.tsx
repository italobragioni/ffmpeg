import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, TRIAL_DAYS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppPreview } from "@/features/landing/app-preview";

const benefits = [
  { icon: ClipboardList, title: "Atendimentos organizados", desc: "Cada família em um único lugar, do primeiro contato à despedida." },
  { icon: CalendarCheck, title: "Agenda operacional", desc: "Velórios, remoções e sepultamentos com alerta de conflito de sala." },
  { icon: CheckCircle2, title: "Checklists automáticos", desc: "Nada é esquecido: cada etapa registrada com responsável e horário." },
  { icon: Users, title: "Equipe conectada", desc: "Toda a equipe acompanha o andamento em tempo real, sem grupos de WhatsApp." },
  { icon: HeartHandshake, title: "Portal para a família", desc: "Uma página respeitosa com as informações da despedida e homenagens." },
  { icon: MessageCircle, title: "Compartilhe no WhatsApp", desc: "Envie as informações da cerimônia com um toque, no formato certo." },
];

const faqs = [
  { q: "Preciso instalar algo?", a: "Não. O SOLENE funciona no navegador do computador e do celular, e pode ser instalado como aplicativo na tela inicial." },
  { q: "Meus dados ficam seguros?", a: "Sim. Cada funerária tem um ambiente isolado, com controle de acesso por perfil e proteção de dados desde a arquitetura (LGPD)." },
  { q: "Preciso de cartão de crédito para testar?", a: `Não. São ${TRIAL_DAYS} dias grátis, sem cartão. Você só decide o plano quando quiser continuar.` },
  { q: "Consigo usar pelo celular?", a: "Sim. O SOLENE é pensado para o celular — botões grandes, telas simples e ações rápidas para quem está em campo." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#beneficios" className="hover:text-foreground">Benefícios</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#faq" className="hover:text-foreground">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Testar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,hsl(var(--accent))_0%,transparent_70%)]" />
        <div className="container grid grid-cols-1 gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3.5" /> Feito para funerárias brasileiras
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
              Organize cada atendimento funerário em um só lugar.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Do primeiro contato à despedida, acompanhe sua operação com mais
              organização, segurança e tranquilidade.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Testar grátis por {TRIAL_DAYS} dias <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#beneficios">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
          <div className="animate-fade-in">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="container py-14 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold text-foreground md:text-3xl">
            Chega de informações espalhadas entre papel, planilhas e WhatsApp.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            O SOLENE substitui cadernos, planilhas e grupos internos por um
            sistema simples que toda a equipe entende — mesmo quem não tem
            familiaridade com tecnologia.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="container py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Tudo o que sua funerária precisa
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ferramentas pensadas para o dia a dia de quem cuida das famílias.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <Card key={b.title} className="transition-shadow hover:shadow-lift">
              <CardContent className="p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <b.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="border-t border-border/60 bg-card/50">
        <div className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
              Planos simples e justos
            </h2>
            <p className="mt-3 text-muted-foreground">
              Comece com {TRIAL_DAYS} dias grátis. Sem cartão de crédito.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col",
                  plan.highlight && "border-primary shadow-lift ring-1 ring-primary/20",
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Mais completo
                  </span>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-foreground">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link href="/signup">Começar teste grátis</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-foreground md:text-3xl">
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-card p-4 shadow-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                  {f.q}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="container py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold text-foreground md:text-3xl">
            Comece hoje a organizar sua funerária
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Leva poucos minutos para configurar. Sua equipe agradece.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">
              Testar grátis por {TRIAL_DAYS} dias <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/50">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} SOLENE. Gestão funerária simples e organizada.</p>
        </div>
      </footer>
    </div>
  );
}
