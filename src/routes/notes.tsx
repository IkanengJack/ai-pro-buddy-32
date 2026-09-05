import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Loader2, NotebookPen, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { CopyButton, EditableOutput } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summariseNotes } from "@/lib/ai.functions";
import { logActivity } from "@/lib/activity";
import { aiErrorMessage } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

type Action = { task: string; owner: string; due: string; done: boolean };

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summariser — Workplace AI" },
      {
        name: "description",
        content:
          "Paste a meeting transcript and get an executive summary, the key decisions and an interactive action-item checklist.",
      },
      { property: "og:title", content: "Meeting Notes Summariser — Workplace AI" },
      {
        property: "og:description",
        content: "Transcripts become summaries, decisions and owned action items in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const run = useServerFn(summariseNotes);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const hasResult = summary || decisions.length > 0 || actions.length > 0;

  async function submit() {
    if (transcript.trim().length < 20) {
      toast.error("Paste a bit more of the transcript first");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { transcript } });
      setSummary(res.summary ?? "");
      setDecisions(res.decisions ?? []);
      setActions((res.actions ?? []).map((a) => ({ ...a, done: false })));
      logActivity("Meeting summarised", `${res.actions?.length ?? 0} action items`);
    } catch (error) {
      toast.error(aiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const checklistText = actions
    .map((a) => `- [${a.done ? "x" : " "}] ${a.task} (${a.owner} · ${a.due})`)
    .join("\n");

  return (
    <AppShell
      title="Meeting Notes Summariser"
      description="Transcript in, decisions and actions out"
      children={
        <div className="space-y-6">
          <div className="panel space-y-4 p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="transcript">Meeting transcript or rough notes</Label>
              <Textarea
                id="transcript"
                rows={12}
                placeholder="Paste the full transcript, chat log or your scrappy notes here…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : "No text yet"}
              </p>
              <Button onClick={submit} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {loading ? "Summarising…" : "Summarise"}
              </Button>
            </div>
          </div>

          {loading && !hasResult && (
            <div className="panel flex flex-col items-center justify-center gap-3 p-10 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm">Reading the transcript and pulling out the decisions…</p>
            </div>
          )}

          {!loading && !hasResult && (
            <div className="panel flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <NotebookPen className="size-7 text-primary/60" />
              <p className="max-w-sm text-sm">
                Your executive summary, key decisions and action checklist will appear here.
              </p>
            </div>
          )}

          {hasResult && (
            <div className="space-y-6">
              <section className="panel p-5 sm:p-6">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Executive summary
                </h2>
                <div className="mt-3">
                  <EditableOutput value={summary} onChange={setSummary} rows={6} />
                </div>
              </section>

              <section className="panel p-5 sm:p-6">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Key decisions
                </h2>
                <ul className="mt-3 space-y-2">
                  {decisions.length === 0 && (
                    <li className="text-sm text-muted-foreground">No explicit decisions found.</li>
                  )}
                  {decisions.map((d, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed"
                    >
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                      {d}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Action items
                  </h2>
                  <CopyButton value={checklistText} label="Copy checklist" />
                </div>
                <ul className="mt-3 space-y-2">
                  {actions.length === 0 && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ClipboardList className="size-4" /> No action items detected.
                    </li>
                  )}
                  {actions.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                    >
                      <Checkbox
                        checked={a.done}
                        onCheckedChange={(v) =>
                          setActions((prev) =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, done: v === true } : item,
                            ),
                          )
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            a.done && "text-muted-foreground line-through",
                          )}
                        >
                          {a.task}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.owner} · due {a.due}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      }
    />
  );
}
