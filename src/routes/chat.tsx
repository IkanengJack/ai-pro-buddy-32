import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, RotateCcw, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Markdown } from "@/components/markdown";
import { CopyButton } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatReply } from "@/lib/ai.functions";
import { aiErrorMessage, useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const CHIPS = [
  "Draft a meeting agenda",
  "Proofread this sentence",
  "Summarise this in 3 bullets",
  "Turn these notes into an update",
  "Suggest a polite follow-up",
];

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Assistant Chat — Workplace AI" },
      {
        name: "description",
        content:
          "A focused workplace chat assistant for drafting agendas, proofreading, summarising and answering day-to-day work questions.",
      },
      { property: "og:title", content: "Assistant Chat — Workplace AI" },
      {
        property: "og:description",
        content: "Chat with a workplace assistant that remembers the thread of your conversation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const run = useServerFn(chatReply);
  const [messages, setMessages] = useLocalState<Msg[]>("wpa-chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await run({
        data: { messages: history.map(({ role, content }) => ({ role, content })) },
      });
      setMessages([
        ...history,
        { id: crypto.randomUUID(), role: "assistant", content: res.text },
      ]);
    } catch (error) {
      toast.error(aiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Assistant Chat"
      description="Conversational help with memory of this thread"
      children={
        <div className="panel flex h-[68vh] min-h-[520px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="size-2 rounded-full bg-success" />
              Workplace assistant
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              <RotateCcw className="size-4" /> New conversation
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </div>
                <p className="max-w-sm text-sm">
                  Ask a question, paste text to tidy up, or tap a quick prompt below.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] space-y-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground"
                      : "whitespace-pre-wrap",
                  )}
                >
                  {m.role === "assistant" ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.role === "assistant" && <CopyButton value={m.content} />}
                </div>
                {m.role === "user" && (
                  <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="space-y-3 border-t border-border bg-surface px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => send(c)}
                  disabled={loading}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask the assistant… (Enter to send, Shift+Enter for a new line)"
                className="min-h-[52px] resize-none bg-card"
              />
              <Button
                size="icon"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="size-11 shrink-0"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
}
