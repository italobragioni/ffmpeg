"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/format";
import { toggleTask, addTask, editTask, deleteTask } from "../actions";
import { cn } from "@/lib/utils";
import type { CaseTask } from "@/types";

type Task = CaseTask & { completer?: { full_name: string | null } | null };

export function Checklist({
  caseId,
  tasks: initialTasks,
  canEdit,
}: {
  caseId: string;
  tasks: Task[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const done = tasks.filter((t) => t.is_done).length;

  async function toggle(task: Task) {
    if (!canEdit) return;
    const value = !task.is_done;
    setTasks((ts) =>
      ts.map((t) =>
        t.id === task.id
          ? { ...t, is_done: value, completed_at: value ? new Date().toISOString() : null }
          : t,
      ),
    );
    const res = await toggleTask(task.id, value);
    if (!res.ok) {
      toast.error(res.error);
      setTasks(initialTasks);
    } else {
      router.refresh();
    }
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    const res = await addTask(caseId, title);
    if (!res.ok) return toast.error(res.error);
    setNewTitle("");
    setAdding(false);
    toast.success("Tarefa adicionada.");
    router.refresh();
  }

  async function saveEdit(id: string) {
    const title = editTitle.trim();
    if (!title) return;
    const res = await editTask(id, title, caseId);
    if (!res.ok) return toast.error(res.error);
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await deleteTask(id, caseId);
    if (!res.ok) return toast.error(res.error);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {done} de {tasks.length} concluídas
        </p>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-border/60">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-3 py-2.5">
            <button
              onClick={() => toggle(task)}
              disabled={!canEdit}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                task.is_done
                  ? "border-success bg-success text-success-foreground"
                  : "border-input bg-card hover:border-primary",
              )}
              aria-label={task.is_done ? "Desmarcar" : "Concluir"}
            >
              {task.is_done && <Check className="size-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              {editingId === task.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                  />
                  <Button size="icon" className="size-8" onClick={() => saveEdit(task.id)}>
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <p
                    className={cn(
                      "text-sm",
                      task.is_done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.is_done && task.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Concluído por {task.completer?.full_name ?? "alguém"} às{" "}
                      {formatTime(task.completed_at)}
                    </p>
                  )}
                </>
              )}
            </div>
            {canEdit && editingId !== task.id && (
              <div className="flex shrink-0 gap-0.5">
                <button
                  onClick={() => {
                    setEditingId(task.id);
                    setEditTitle(task.title);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => remove(task.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Excluir"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {canEdit &&
        (adding ? (
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nova tarefa…"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button size="sm" onClick={add}>
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAdding(true)}>
            <Plus /> Adicionar tarefa
          </Button>
        ))}
    </Card>
  );
}
