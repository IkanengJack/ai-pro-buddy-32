import { Link } from "@tanstack/react-router";
import {
  Bot,
  CalendarRange,
  LayoutDashboard,
  Mail,
  Menu,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, blurb: "Activity & shortcuts" },
  { to: "/email", label: "Email Generator", icon: Mail, blurb: "Draft in the right tone" },
  { to: "/notes", label: "Notes Summariser", icon: NotebookPen, blurb: "Transcript to actions" },
  { to: "/planner", label: "Task Planner", icon: CalendarRange, blurb: "Eisenhower schedule" },
  { to: "/chat", label: "Assistant Chat", icon: Bot, blurb: "Ask anything" },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("wpa-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Bot className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold tracking-tight">Workplace AI</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Productivity suite
        </p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.to === "/" }}
          className="group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
          }}
        >
          <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="min-w-0">
            <span className="block truncate">{item.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{item.blurb}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ShieldCheck className="size-4 text-primary" />
          Responsible AI
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Outputs are drafts. Verify facts, figures and names before sending or acting.
        </p>
      </div>
    </div>
  );
}

export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-foreground dark:text-accent" />
      <p className="text-sm leading-relaxed text-foreground/90">
        <span className="font-semibold">Responsible AI disclaimer.</span> This assistant produces
        AI-generated drafts that can be incomplete or inaccurate. Always review, verify and edit
        every output before using it for professional execution, client communication or any
        decision with legal, financial or HR consequences.
      </p>
    </div>
  );
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarInner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarInner onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base font-semibold sm:text-lg">{title}</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {description}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="surface-grid flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        <footer className="border-t border-border bg-surface px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl space-y-3">
            <DisclaimerBanner />
            <p className="text-xs text-muted-foreground">
              Workplace AI — productivity suite. Human review required on every output.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
