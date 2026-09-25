"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Palette, UserCog, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BRAND_COLORS = ["#174C4F", "#1E5B7B", "#3B5B4A", "#5B4B8A", "#8A5B3B", "#334155"];

const STEPS = [
  { icon: Building2, title: "Dados da empresa" },
  { icon: Palette, title: "Personalização" },
  { icon: UserCog, title: "Administrador" },
];

export function OnboardingWizard({
  defaultName,
  defaultPhone,
  email,
}: {
  defaultName: string;
  defaultPhone: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [company, setCompany] = useState({
    name: "",
    cnpj: "",
    phone: "",
    whatsapp: "",
    email,
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });

  // Step 2
  const [color, setColor] = useState("#174C4F");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3
  const [admin, setAdmin] = useState({ full_name: defaultName, phone: defaultPhone });

  function update<K extends keyof typeof company>(key: K, value: string) {
    setCompany((c) => ({ ...c, [key]: value }));
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function next() {
    if (step === 0 && !company.name.trim()) {
      toast.error("Informe o nome da funerária.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function finish() {
    if (!admin.full_name.trim()) {
      toast.error("Informe o nome do administrador.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { data: orgId, error } = await supabase.rpc("create_organization", {
      p_name: company.name,
      p_cnpj: company.cnpj || null,
      p_phone: company.phone || null,
      p_whatsapp: company.whatsapp || null,
      p_email: company.email || null,
      p_zip_code: company.zip_code || null,
      p_street: company.street || null,
      p_number: company.number || null,
      p_complement: company.complement || null,
      p_district: company.district || null,
      p_city: company.city || null,
      p_state: company.state || null,
    });

    if (error || !orgId) {
      setLoading(false);
      toast.error("Não foi possível criar a funerária", { description: error?.message });
      return;
    }

    // Upload logo (optional)
    let logoUrl: string | null = null;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `${orgId}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("branding")
        .upload(path, logoFile, { upsert: true });
      if (!upErr) {
        logoUrl = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
      }
    }

    await supabase
      .from("organizations")
      .update({
        primary_color: color,
        logo_url: logoUrl,
        onboarding_completed: true,
      })
      .eq("id", orgId);

    await supabase.auth.updateUser({ data: { full_name: admin.full_name } });
    await supabase
      .from("profiles")
      .update({ full_name: admin.full_name, phone: admin.phone || null })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    toast.success("Tudo pronto! Bem-vindo ao SOLENE.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  i < step && "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary bg-accent text-primary",
                  i > step && "border-border bg-card text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <h1 className="mb-1 text-lg font-semibold text-foreground">{STEPS[step].title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Passo {step + 1} de {STEPS.length}
            </p>

            {step === 0 && (
              <div className="space-y-4">
                <Field label="Nome da funerária" required>
                  <Input value={company.name} onChange={(e) => update("name", e.target.value)} placeholder="Funerária Serenidade" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CNPJ (opcional)">
                    <Input value={company.cnpj} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
                  </Field>
                  <Field label="Telefone">
                    <Input value={company.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 0000-0000" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="WhatsApp">
                    <Input value={company.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
                  </Field>
                  <Field label="E-mail">
                    <Input type="email" value={company.email} onChange={(e) => update("email", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="CEP">
                    <Input value={company.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Rua">
                      <Input value={company.street} onChange={(e) => update("street", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Número">
                    <Input value={company.number} onChange={(e) => update("number", e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Complemento">
                      <Input value={company.complement} onChange={(e) => update("complement", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Bairro">
                    <Input value={company.district} onChange={(e) => update("district", e.target.value)} />
                  </Field>
                  <Field label="Cidade">
                    <Input value={company.city} onChange={(e) => update("city", e.target.value)} />
                  </Field>
                  <Field label="Estado">
                    <Input value={company.state} onChange={(e) => update("state", e.target.value)} maxLength={2} placeholder="SP" />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <Field label="Logo da funerária (opcional)">
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Prévia" className="size-full object-contain" />
                      ) : (
                        <Building2 className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3 text-sm shadow-soft hover:bg-muted">
                        Escolher imagem
                      </span>
                      <input type="file" accept="image/*" className="sr-only" onChange={onLogo} />
                    </label>
                  </div>
                </Field>
                <Field label="Cor principal">
                  <div className="flex flex-wrap gap-3">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "size-9 rounded-full border-2 transition-transform",
                          color === c ? "scale-110 border-foreground" : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor ${c}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="size-9 cursor-pointer rounded-full border border-border bg-transparent"
                      aria-label="Cor personalizada"
                    />
                  </div>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
                  Você será o administrador desta funerária. Confirme seus dados.
                </p>
                <Field label="Nome do administrador" required>
                  <Input value={admin.full_name} onChange={(e) => setAdmin((a) => ({ ...a, full_name: e.target.value }))} />
                </Field>
                <Field label="Telefone">
                  <Input value={admin.phone} onChange={(e) => setAdmin((a) => ({ ...a, phone: e.target.value }))} />
                </Field>
                <Field label="E-mail">
                  <Input value={email} disabled />
                </Field>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || loading}
              >
                <ArrowLeft /> Voltar
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next}>
                  Continuar <ArrowRight />
                </Button>
              ) : (
                <Button onClick={finish} loading={loading}>
                  Concluir configuração
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
