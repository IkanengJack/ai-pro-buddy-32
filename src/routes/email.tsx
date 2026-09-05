import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EditableOutput } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { logActivity } from "@/lib/activity";
import { aiErrorMessage } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

const TONES = ["Formal", "Friendly", "Persuasive", "Apologetic"] as const;
type Tone = (typeof TONES)[number];

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      {
        name: "description",
        content:
          "Generate professional emails from a recipient context and key points, in a formal, friendly, persuasive or apologetic tone.",
      },
      { property: "og:title", content: "Smart Email Generator — Workplace AI" },
      {
        property: "og:description",
        content: "Turn bullet points into a polished, tone-matched email you can edit and copy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!recipient.trim() || !keyPoints.trim()) {
      toast.error("Add recipient context and at least one key point");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { recipient, keyPoints, tone } });
      setOutput(res.text);
      logActivity("Email generated", `${tone} · ${recipient}`);
    } catch (error) {
      toast.error(aiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Smart Email Generator"
      description="From key points to a send-ready draft"
      children={
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient context</Label>
              <Input
                id="recipient"
                placeholder="e.g. Thabo, procurement lead at a supplier we're late paying"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Key points to include</Label>
              <Textarea
                id="points"
                rows={8}
                placeholder={"• Invoice 4021 will be paid on Friday\n• Apologise for the delay\n• Ask to keep deliveries running"}
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={cn(
                      "rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                      tone === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-surface hover:bg-accent/10",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={submit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {loading ? "Writing your email…" : "Generate email"}
            </Button>
          </div>

          <div className="panel p-5 sm:p-6">
            {loading && !output ? (
              <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm">Drafting in a {tone.toLowerCase()} tone…</p>
              </div>
            ) : output ? (
              <EditableOutput value={output} onChange={setOutput} />
            ) : (
              <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Mail className="size-7 text-primary/60" />
                <p className="max-w-xs text-sm">
                  Your draft will appear here, ready to edit and copy.
                </p>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
