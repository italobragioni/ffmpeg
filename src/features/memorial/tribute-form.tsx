"use client";

import { useState } from "react";
import { Heart, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TributeForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("post_memorial_message", {
      p_slug: slug,
      p_author_name: name.trim(),
      p_body: body.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar sua homenagem.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-6" />
        </div>
        <p className="font-medium text-foreground">Homenagem enviada com carinho.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua mensagem passará por uma breve revisão antes de aparecer na página.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="t-name">Seu nome</Label>
        <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-body">Mensagem</Label>
        <Textarea
          id="t-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Deixe uma palavra de carinho para a família…"
        />
      </div>
      <Button type="submit" className="w-full" loading={loading}>
        <Heart /> Enviar homenagem
      </Button>
    </form>
  );
}
