"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface ModuleCardProps {
  name: string;
  number: string;
  moduleId?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  isLoading?: boolean;
}

export function ModuleCard({ name, number, moduleId, difficulty, isLoading }: ModuleCardProps) {
  if (isLoading) {
    return <ModuleCardSkeleton />;
  }

  const difficultyDot = {
    Easy: "bg-green-500",
    Medium: "bg-amber-500",
    Hard: "bg-red-500",
  };

  const content = (
    <Card className="group border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="font-mono text-sm text-muted-foreground">{number}</p>
              {difficulty && (
                <span className={`h-2 w-2 rounded-full ${difficultyDot[difficulty]}`} />
              )}
            </div>
            <h3 className="truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
              {name}
            </h3>
          </div>
          <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </CardContent>
    </Card>
  );

  if (moduleId || number) {
    return (
      <Link href={`/modules/${moduleId || number}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ModuleCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
