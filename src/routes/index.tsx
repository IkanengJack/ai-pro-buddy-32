import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CalendarRange, Mail, NotebookPen, Sparkle } from "lucide-react";

import { AppShell, DisclaimerBanner } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useLocalState } from "@/lib/use-local-state";

export type ActivityItem = { id: string; tool: string; detail: string; at: number };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workplace AI — Productivity Assistant Dashboard" },
      {
        name: "description",
        content:
          "Draft emails, summarise meetings, plan your week with the Eisenhower matrix and chat with an AI assistant built for professional work.",
      },
      { property: "og:title", content: "Workplace AI — Productivity Assistant Dashboard" },
      {
        property: "og:description",
        content:
          "One workspace for AI email drafting, meeting summaries, prioritised task planning and assistant chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const SHORTCUTS = [
  {
    to: "/email",
    label: "Smart Email Generator",
    copy: "Turn a few bullet points into a polished email in the tone you choose.",
    icon: Mail,
  },
  {
    to: "/notes",
    label: "Meeting Notes Summariser",
    copy: "Paste a transcript and get a summary, decisions and an action checklist.",
    icon: NotebookPen,
  },
  {
    to: "/planner",
    label: "Task Planner & Scheduler",
    copy: "Drop a chaotic to-do list and get a prioritised weekly schedule.",
    icon: CalendarRange,
  },
  {
    to: "/chat",
    label: "Assistant Chat",
    copy: "Ask questions, proofread text or draft agendas in a conversation.",
    icon: Bot,
  },
] as const;

function Dashboard() {
  const [activity] = useLocalState<ActivityItem[]>("wpa-activity", []);

  return (
    <AppShell
      title="Dashboard"
      description="Your AI workspace at a glance"
      children={
        <div className="space-y-8">
          <section className="panel overflow-hidden">
            <div className="space-y-4 p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkle className="size-3.5 text-accent" />
                Human-in-the-loop by design
              </span>
              <h2 className="max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
                <span className="text-gradient-brand">Do the thinking.</span>
                <br />
                Let the assistant do the typing.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Four focused tools for the work that eats your week — email, meeting notes,
                planning and quick questions. Every output is editable before you use it.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild>
                  <Link to="/email">
                    Draft an email <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/planner">Plan my week</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Quick launch
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="panel group flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="size-4" />
                    </div>
                    <p className="font-display text-sm font-semibold">{s.label}</p>
                    <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="panel p-5">
              <h3 className="font-display text-sm font-semibold">Recent activity</h3>
              {activity.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing yet. Generate an email, summary or plan and it will appear here.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {activity.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.tool}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                      </div>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {new Date(a.at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DisclaimerBanner className="h-fit" />
          </section>
        </div>
      }
    />
  );
}
