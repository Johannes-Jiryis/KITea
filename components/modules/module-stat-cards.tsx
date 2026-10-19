import { BarChart3, MessageSquare, Star, TrendingUp } from "lucide-react";

import { difficultyLabel, formatRating } from "@/lib/search/format";
import type { ModulePageData } from "@/lib/modules/types";
import { cn } from "@/lib/utils";

type ModuleStatCardsProps = {
  stats: ModulePageData["stats"];
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm backdrop-blur-sm",
        "transition-all duration-300 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10",
            accent,
          )}
        >
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

export function ModuleStatCards({ stats }: ModuleStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Average rating"
        value={formatRating(stats.averageRating)}
        sub="Overall student score"
        icon={Star}
      />
      <StatCard
        label="Difficulty"
        value={formatRating(stats.averageDifficulty)}
        sub={difficultyLabel(stats.averageDifficulty)}
        icon={TrendingUp}
      />
      <StatCard
        label="Workload"
        value={formatRating(stats.averageWorkload)}
        sub="Out of 5"
        icon={BarChart3}
      />
      <StatCard
        label="Reviews"
        value={String(stats.reviewCount)}
        sub={stats.reviewCount === 1 ? "review" : "reviews"}
        icon={MessageSquare}
      />
    </div>
  );
}
