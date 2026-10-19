import Link from "next/link";
import { Calendar, PenLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModulePageData } from "@/lib/modules/types";

type ModuleHeaderProps = {
  module: Pick<ModulePageData, "id" | "moduleNumber" | "moduleName" | "description" | "semesters">;
  isAuthenticated: boolean;
};

export function ModuleHeader({ module, isAuthenticated }: ModuleHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground">{module.moduleNumber}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {module.moduleName}
          </h1>
          {module.description && (
            <p className="max-w-2xl text-base text-muted-foreground text-pretty">
              {module.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {isAuthenticated ? (
            <Button asChild>
              <Link href={`/write-review?moduleId=${module.id}`}>
                <PenLine className="mr-2 h-4 w-4" />
                Write a review
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/modules/${module.moduleNumber}`)}`}
              >
                Sign in to review
              </Link>
            </Button>
          )}
        </div>
      </div>

      {module.semesters.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Semester availability
          </div>
          <div className="flex flex-wrap gap-2">
            {module.semesters.map((semester) => (
              <Badge key={semester.id} variant="secondary">
                {semester.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
