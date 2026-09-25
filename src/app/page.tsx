import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  MessageCircle,
  Users,
  Sparkles,
  X,
  Zap,
  ShieldCheck,
  Clock,
  Smartphone,
  LineChart,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, TRIAL_DAYS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppPreview } from "@/features/landing/app-preview";

const pains = [
  "Informação de atendimento perdida entre caderno, planilha e três grupos de WhatsApp.",
  "Você liga pra equipe pra saber “em que pé está” — de novo.",
  "Um horário de velório trocado, uma sala reservada em dobro, uma família cobrando.",
  "No fim do mês, ninguém sabe ao certo quanto entrou, quanto falta receber.",
];

const benefits = [
  { icon: ClipboardList, title: "Todo atendimento em um só lugar", desc: "Do primeiro contato à despedida, cada etapa registrada — sem depender da memória de ninguém." },
  { icon: CalendarCheck, title: "Agenda que avisa antes do erro", desc: "Velórios, remoções e sepultamentos com alerta automático de conflito de sala." },
  { icon: CheckCircle2, title: "Checklist que não deixa passar nada", desc: "Cada tarefa com responsável, data e hora. Nada esquecido, nada refeito." },
  { icon: Users, title: "Equipe conectada, sem grupo de WhatsApp", desc: "Todo mundo acompanha o andamento em tempo real, do escritório ao campo." },
  { icon: HeartHandshake, title: "Portal da família que impressiona", desc: "Uma página respeitosa com as informações da cerimônia — e mais indicações pra você." },
  { icon: LineChart, title: "Faturamento na palma da mão", desc: "Quanto faturou, quanto recebeu, quanto falta receber. Sem planilha." },
];

const steps = [
  { n: "1", title: "Crie o atendimento em 1 minuto", desc: "Preencha só o essencial. O protocolo, o checklist e a linha do tempo nascem prontos." },
  { n: "2", title: "Acompanhe pelo pipeline", desc: "Arraste da remoção à finalização. Toda a equipe vê o mesmo andamento, na hora." },
  { n: "3", title: "Cuide da família (e da reputação)", desc: "Portal público, informações no WhatsApp e nada de erro na despedida." },
];

const faqs = [
  { q: "Preciso instalar ou ter computador?", a: "Não. Funciona no navegador do celular e do computador, e pode ser instalado como aplicativo na tela inicial. Sua equipe usa direto do celular." },
  { q: "É difícil de aprender?", a: "Foi feito para quem não é de tecnologia. Botões grandes, telas simples e o essencial à mão. A maioria começa a usar no mesmo dia." },
  { q: "E os meus dados?", a: "Cada funerária tem um ambiente isolado, com acesso por perfil e proteção de dados desde a arquitetura (LGPD). Ninguém de fora vê seus atendimentos." },
  { q: "Preciso de cartão para testar?", a: `Não. São ${TRIAL_DAYS} dias grátis, sem cartão e sem compromisso. Se não fizer sentido, é só parar — não cobramos nada.` },
  { q: "Já tenho tudo no caderno. Vale a pena mudar?", a: "O caderno não avisa conflito de sala, não lembra do checklist, não mostra o faturamento e some quando molha. O SOLENE faz tudo isso — e sua equipe agradece." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#problema" className="hover:text-foreground">O problema</a>
            <a href="#beneficios" className="hover:text-foreground">Benefícios</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_50%_-10%,hsl(var(--accent))_0%,transparent_70%)]" />
        <div className="container grid grid-cols-1 gap-12 py-14 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3.5" /> O sistema das funerárias organizadas
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
              Chega de perder atendimento
              <span className="text-primary"> — e dinheiro</span> no caderno e no WhatsApp.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              O SOLENE organiza cada atendimento funerário do primeiro contato à despedida.
              Menos erro, menos retrabalho, mais controle — e uma família bem atendida do começo ao fim.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Começar teste grátis <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#beneficios">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> {TRIAL_DAYS} dias grátis</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> Sem cartão de crédito</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> Cancele quando quiser</span>
            </p>
          </div>
          <div className="animate-fade-in">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Substitui */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="container flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Um sistema no lugar de tudo isso
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-lg font-medium text-foreground">
            {["Cadernos", "Planilhas", "Papéis soltos", "Grupos de WhatsApp", "Controle na memória"].map((t, i) => (
              <span key={t} className="inline-flex items-center gap-3">
                {i > 0 && <span className="text-border">•</span>}
                <span className="inline-flex items-center gap-1.5 text-muted-foreground line-through decoration-destructive/60">
                  {t}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problema (dor) */}
      <section id="problema" className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-foreground md:text-3xl">
            Cada informação que some tem um custo. E não é só o seu.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Quando o atendimento é bagunçado, quem paga o preço é a família na hora mais difícil —
            e a sua reputação, que vale mais que qualquer anúncio.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pains.map((p) => (
              <div key={p} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="size-4" />
                </span>
                <p className="text-sm text-foreground">{p}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-lg font-medium text-foreground">
            Você não precisa de mais um caderno. Precisa de um lugar onde nada se perde.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="border-t border-border/60 bg-card/50">
        <div className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
              Do caos ao controle — em um só sistema
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
        </div>
      </section>

      {/* Como funciona */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Simples assim</h2>
          <p className="mt-3 text-muted-foreground">Sua equipe começa a usar hoje. Sem treinamento complicado.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-lg border border-border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferencial — banda destaque */}
      <section className="bg-primary text-primary-foreground">
        <div className="container grid grid-cols-1 items-center gap-10 py-16 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <HeartHandshake className="size-3.5" /> O diferencial que a família percebe
            </span>
            <h2 className="mt-5 text-2xl font-semibold md:text-3xl">
              Uma despedida bem cuidada vira indicação. E indicação é o que enche sua agenda.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Gere uma página pública, respeitosa e elegante para cada família, com os horários da
              cerimônia e um espaço para homenagens. Compartilhe tudo no WhatsApp com um toque.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Portal da família com “Como chegar” e homenagens moderadas",
                "Informações da cerimônia no WhatsApp, no formato certo",
                "Sua marca e sua cor em cada detalhe",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-secondary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/signup">
                Quero isso na minha funerária <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: MessageCircle, t: "Compartilhe no WhatsApp" },
              { icon: Smartphone, t: "Funciona no celular" },
              { icon: Clock, t: "Alerta de conflito de sala" },
              { icon: ShieldCheck, t: "Dados isolados e seguros" },
            ].map((c) => (
              <div key={c.t} className="rounded-xl bg-primary-foreground/10 p-5">
                <c.icon className="size-6 text-secondary" />
                <p className="mt-3 text-sm font-medium">{c.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-t border-border/60 bg-card/50">
        <div className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
              Menos que uma diária de urna. Todo mês organizado.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Comece com {TRIAL_DAYS} dias grátis, sem cartão. Escolha o plano só quando quiser continuar.
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
                    Mais escolhido
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
          {/* Garantia */}
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-lg border border-border bg-card p-5">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-success" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Risco zero.</strong> Você testa {TRIAL_DAYS} dias
              com tudo funcionando, sem cartão e sem compromisso. Se não organizar sua operação,
              é só não continuar — você não paga nada.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-foreground md:text-3xl">
            Ainda com dúvida?
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-card p-4 shadow-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-foreground">
                  {f.q}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/60">
        <div className="container py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Zap className="size-3.5" /> Leva 2 minutos para configurar
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold text-foreground md:text-4xl">
            Organize sua funerária antes do próximo atendimento.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Comece hoje, grátis. Sua equipe — e as famílias que você atende — vão sentir a diferença.
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
        <div className="container flex flex-col items-center justify-between gap-4 py-8 pb-24 text-sm text-muted-foreground sm:flex-row md:pb-8">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} SOLENE. Gestão funerária simples e organizada.</p>
        </div>
      </footer>

      {/* CTA fixo no mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur safe-bottom md:hidden">
        <Button asChild size="lg" className="w-full">
          <Link href="/signup">
            Testar grátis por {TRIAL_DAYS} dias <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
