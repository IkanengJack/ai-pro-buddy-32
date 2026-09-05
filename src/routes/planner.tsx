import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarRange, Loader2, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { planTasks } from "@/lib/ai.functions";
import { logActivity } from "@/lib/activity";
import { aiErrorMessage, useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

type Quadrant = "do" | "schedule" | "delegate" | "eliminate";
type Task = {
  id: string;
  title: string;
  quadrant: Quadrant;
  day: string;
  estimate: string;
  why: string;
  done: boolean;
};

const QUADRANTS: Array<{ key: Quadrant; label: string; hint: string; tone: string }> = [
  { key: "do", label: "Do first", hint: "Urgent & important", tone: "border-destructive/40" },
  { key: "schedule", label: "Schedule", hint: "Important, not urgent", tone: "border-primary/40" },
  { key: "delegate", label: "Delegate", hint: "Urgent, not important", tone: "border-accent/50" },
  {
    key: "eliminate",
    label: "Eliminate",
    hint: "Neither urgent nor important",
    tone: "border-border",
  },
];

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler — Workplace AI" },
      {
        name: "description",
        content:
          "Turn a chaotic weekly to-do list into a prioritised schedule sorted by the Eisenhower matrix, with editable checkboxes.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler — Workplace AI" },
      {
        property: "og:description",
        content: "Brain-dump your week and get an ordered, prioritised plan you can tick off.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const run = useServerFn(planTasks);
  const [braindump, setBraindump] = useState("");
  const [tasks, setTasks, hydrated] = useLocalState<Task[]>("wpa-tasks", []);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (braindump.trim().length < 5) {
      toast.error("List a few tasks first");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { braindump } });
      setTasks(
        (res.tasks ?? []).map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          done: false,
        })),
      );
      logActivity("Week planned", `${res.tasks?.length ?? 0} tasks prioritised`);
    } catch (error) {
      toast.error(aiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const planText = QUADRANTS.map((q) => {
    const rows = tasks.filter((t) => t.quadrant === q.key);
    if (!rows.length) return "";
    return `${q.label} (${q.hint})\n${rows.map((t) => `- ${t.title} — ${t.day}, ${t.estimate}`).join("\n")}`;
  })
    .filter(Boolean)
    .join("\n\n");

  return (
    <AppShell
      title="AI Task Planner & Scheduler"
      description="Chaotic list in, prioritised week out"
      children={
        <div className="space-y-6">
          <div className="panel space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="braindump">This week's tasks</Label>
              <Textarea
                id="braindump"
                rows={8}
                placeholder={"finish Q3 report\ncall the printer about the banners\nprep board slides\nrespond to Lerato\nsort out laptop warranty"}
                value={braindump}
                onChange={(e) => setBraindump(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Sorted with the Eisenhower matrix. Your plan is saved in this browser.
              </p>
              <Button onClick={submit} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {loading ? "Prioritising…" : "Organise my week"}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="panel flex flex-col items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm">Sorting by urgency and importance…</p>
            </div>
          )}

          {!loading && hydrated && tasks.length === 0 && (
            <div className="panel flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <CalendarRange className="size-7 text-primary/60" />
              <p className="max-w-sm text-sm">
                Your prioritised schedule will appear here in four quadrants.
              </p>
            </div>
          )}

          {tasks.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {tasks.filter((t) => t.done).length} of {tasks.length} done
                </p>
                <div className="flex gap-2">
                  <CopyButton value={planText} label="Copy plan" />
                  <Button variant="outline" size="sm" onClick={() => setTasks([])}>
                    <Trash2 className="size-4" /> Clear
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {QUADRANTS.map((q) => {
                  const rows = tasks.filter((t) => t.quadrant === q.key);
                  return (
                    <section key={q.key} className={cn("panel border-l-4 p-5", q.tone)}>
                      <h2 className="font-display text-sm font-semibold">{q.label}</h2>
                      <p className="text-xs text-muted-foreground">{q.hint}</p>
                      <ul className="mt-3 space-y-2">
                        {rows.length === 0 && (
                          <li className="text-sm text-muted-foreground">Nothing here.</li>
                        )}
                        {rows.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                          >
                            <Checkbox
                              checked={t.done}
                              onCheckedChange={(v) =>
                                setTasks((prev) =>
                                  prev.map((item) =>
                                    item.id === t.id ? { ...item, done: v === true } : item,
                                  ),
                                )
                              }
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <Input
                                value={t.title}
                                onChange={(e) =>
                                  setTasks((prev) =>
                                    prev.map((item) =>
                                      item.id === t.id ? { ...item, title: e.target.value } : item,
                                    ),
                                  )
                                }
                                className={cn(
                                  "h-8 border-transparent bg-transparent px-0 text-sm shadow-none focus-visible:border-input focus-visible:px-2",
                                  t.done && "text-muted-foreground line-through",
                                )}
                              />
                              <p className="text-xs text-muted-foreground">
                                {t.day} · {t.estimate} · {t.why}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
