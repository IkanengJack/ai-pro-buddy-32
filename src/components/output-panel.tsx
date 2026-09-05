import { Check, Copy, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Your browser blocked copying");
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} disabled={!value}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function EditableOutput({
  value,
  onChange,
  rows = 14,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Generated draft
        </p>
        <div className="flex gap-2">
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (editing) onChange(draft);
              setEditing(!editing);
            }}
          >
            <Pencil className="size-4" />
            {editing ? "Save edits" : "Edit output"}
          </Button>
          <CopyButton value={editing ? draft : value} />
        </div>
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={rows}
          className="font-sans text-sm leading-relaxed"
        />
      ) : (
        <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed">
          {value}
        </div>
      )}
    </div>
  );
}
