"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";

import { MarkdownPreview } from "@/components/reviews/markdown-preview";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MarkdownFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function MarkdownField({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 4,
  disabled,
  "aria-invalid": ariaInvalid,
}: MarkdownFieldProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex border-b border-border/40 bg-card/50 px-1 pt-1">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "write"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <span className="ml-auto self-center pr-2 text-[10px] text-muted-foreground">
          **bold** · *italic* · - lists
        </span>
      </div>

      {tab === "write" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="min-h-[120px] resize-y rounded-none border-0 bg-transparent focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-[120px] p-4">
          <MarkdownPreview content={value} />
        </div>
      )}
    </div>
  );
}
