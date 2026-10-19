"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearchModules } from "@/hooks/use-search-modules";

export const ModulePicker = ({
  value,
  label,
  onChange,
}: {
  value: string;
  label?: string;
  onChange: (value: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(label);
  const { results, search, clear, isLoading, error } = useSearchModules();
  return (
    <div className="space-y-2">
      {value && <p className="text-sm">{selected || "Module selected"}</p>}
      <Input
        aria-label="Find a module to review"
        placeholder="Search module number or name"
        value={query}
        maxLength={80}
        onChange={(event) => {
          setQuery(event.target.value);
          search(event.target.value);
        }}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {error ||
          (isLoading
            ? "Searching…"
            : query.trim().length >= 2 && !results.length
              ? "No matching modules."
              : "")}
      </p>
      {results.length > 0 && (
        <ul aria-label="Matching modules" className="max-h-60 overflow-auto rounded-md border">
          {results.map((module) => (
            <li key={module.id}>
              <button
                type="button"
                className="w-full p-3 text-left text-sm hover:bg-muted focus:bg-muted"
                onClick={() => {
                  onChange(module.id);
                  setSelected(`${module.moduleNumber} — ${module.moduleName}`);
                  setQuery("");
                  clear();
                }}
              >
                {module.moduleNumber} — {module.moduleName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
