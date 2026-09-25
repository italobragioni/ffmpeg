"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";
import { registerDocument, deleteDocument, getDocumentUrl } from "../documents-actions";
import type { CaseDocument } from "@/types";

const CATEGORY_LABELS: Record<CaseDocument["category"], string> = {
  document: "Documento",
  authorization: "Autorização",
  receipt: "Comprovante",
  other: "Outro",
};

export function DocumentsPanel({
  caseId,
  orgId,
  documents,
  canEdit,
}: {
  caseId: string;
  orgId: string;
  documents: CaseDocument[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<CaseDocument["category"]>("document");
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${orgId}/${caseId}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) {
      setUploading(false);
      toast.error("Falha no upload", { description: error.message });
      return;
    }
    const res = await registerDocument({
      caseId,
      name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      category,
    });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) return toast.error(res.error);
    toast.success("Documento enviado.");
    router.refresh();
  }

  async function open(path: string) {
    const res = await getDocumentUrl(path);
    if (!res.ok) return toast.error(res.error);
    window.open(res.data, "_blank");
  }

  async function remove(doc: CaseDocument) {
    const res = await deleteDocument(doc.id, doc.storage_path, caseId);
    if (!res.ok) return toast.error(res.error);
    toast.success("Documento removido.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as CaseDocument["category"])}
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
          <input ref={inputRef} type="file" className="sr-only" onChange={onFile} />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            Enviar documento
          </Button>
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum documento"
          description="Anexe documentos, autorizações e comprovantes deste atendimento. Os arquivos ficam privados."
        />
      ) : (
        <Card className="divide-y divide-border">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[doc.category]} · {formatDateTime(doc.created_at)}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => open(doc.storage_path)}>
                <Download className="size-4" />
              </Button>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(doc)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
