# SOLENE

**Gestão funerária simples e organizada.**

SOLENE é um SaaS B2B multi-tenant para funerárias pequenas e médias brasileiras.
Ele acompanha todo o processo de um atendimento — da primeira ligação da família
à conclusão do sepultamento ou cremação — substituindo cadernos, planilhas e
grupos de WhatsApp por um sistema simples, rápido e seguro.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** com design system próprio (tokens em `globals.css`)
- **Supabase** — PostgreSQL, Auth, Storage, Realtime
- **PWA** instalável (manifest + service worker)
- Deploy pronto para **Vercel**

## Principais recursos

- Multi-tenant com isolamento por `organization_id` + **Row Level Security**
- Perfis de acesso: Administrador, Gestor, Atendente, Operacional (permissões no front **e** no banco)
- Onboarding da funerária em 3 passos
- Dashboard operacional (eventos do dia, atendimentos em andamento)
- Atendimentos: criação em etapas, **pipeline** + **Kanban** com arrastar-e-soltar
- Checklist automático, timeline/histórico automático, documentos privados (Storage assinado)
- Agenda (dia/semana/mês) com **alerta de conflito de sala**
- **Portal público da família** (LGPD-safe) + homenagens com moderação
- Compartilhamento por WhatsApp (`wa.me` / Web Share API)
- Equipe (convites por link), Estoque com alerta de estoque baixo, Relatórios
- Notificações internas em tempo real, auditoria de ações
- Landing page, planos (Essencial/Pro), trial de 14 dias
- Área de **Super Admin** (`/admin`) para o dono do SaaS

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para banco local) **ou** um projeto Supabase na nuvem

### 2. Instalar dependências
```bash
npm install
```

### 3. Variáveis de ambiente
```bash
cp .env.example .env.local
```
Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API), e
`NEXT_PUBLIC_APP_URL` (ex.: `http://localhost:3000`).

### 4. Banco de dados

**Opção A — Supabase local (recomendado para dev):**
```bash
supabase start
supabase db reset      # aplica migrations em supabase/migrations + seed.sql
```

**Opção B — Projeto na nuvem:**
Aplique as migrations na ordem (`supabase/migrations/0001…0005`) via
`supabase db push` ou colando o SQL no SQL Editor. Depois rode `supabase/seed.sql`
(opcional) para dados de demonstração.

### 5. Rodar o app
```bash
npm run dev
```
Abra http://localhost:3000.

### Logins de demonstração (após o seed)
Senha para todos: `solene123`
- `joao@serenidade.com` — Administrador
- `ana@serenidade.com` — Atendente
- `carlos@serenidade.com` — Operacional
- `owner@solene.app` — **Super Admin** (acessa `/admin`)

> Para tornar qualquer usuário Super Admin manualmente:
> `update public.profiles set is_super_admin = true where id = '<user_id>';`

## Estrutura do projeto

```
src/
  app/                 # Rotas (App Router)
    (auth)/            # login, signup, recuperação de senha
    (app)/             # área autenticada (shell + dashboard, atendimentos, agenda…)
    admin/             # Super Admin do SaaS
    memorial/[slug]/   # portal público da família
    convite/[token]/   # aceite de convite
    api/auth/          # callback e logout
  components/          # UI reutilizável (ui/, layout/, brand/)
  features/            # lógica por domínio (atendimentos, agenda, equipe, estoque…)
  lib/                 # supabase clients, auth, constants, utils, format
  types/               # tipos TypeScript do domínio
supabase/
  migrations/          # schema, funções/triggers, RLS, storage, RPCs públicas
  seed.sql             # dados de demonstração
```

## Banco de dados & segurança

- Todas as tabelas comerciais têm `organization_id` e RLS. Um usuário só enxerga
  dados de organizações das quais é membro ativo.
- Funções `SECURITY DEFINER` (`is_org_member`, `has_org_role`, `is_super_admin`)
  evitam recursão de RLS e centralizam as permissões.
- Onboarding e aceite de convite usam RPCs (`create_organization`, `accept_invitation`).
- O portal público **nunca** lê `funeral_cases` diretamente: usa RPCs que expõem
  apenas os campos autorizados de um memorial **publicado** (padrão: despublicado).
- Documentos ficam em bucket privado com **URLs assinadas**; a `service_role`
  nunca é exposta no cliente.

## Pagamentos (futuro)

A camada de assinatura é **agnóstica de gateway** (`subscriptions.provider`,
`provider_customer_id`, `provider_subscription_id`). É possível integrar Asaas,
Mercado Pago ou Stripe sem alterar o restante do sistema.

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente do `.env.example`.
3. `Build Command: next build` (padrão). Deploy.
4. No Supabase Auth, adicione a URL de produção em *Redirect URLs*
   (`https://SEU-DOMINIO/api/auth/callback`).

---

© SOLENE — Gestão funerária simples e organizada.
