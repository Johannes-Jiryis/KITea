"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ModulePageData } from "@/lib/modules/types";
import { cn } from "@/lib/utils";

type ModuleChartsProps = {
  stats: ModulePageData["stats"];
};

const ratingChartConfig = {
  count: { label: "Reviews", color: "hsl(var(--primary))" },
};

function ScoreGauge({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number | null;
  colorClass: string;
}) {
  const pct = value !== null ? (value / 5) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">
          {value !== null ? value.toFixed(1) : "—"}
          <span className="text-sm font-normal text-muted-foreground"> / 5</span>
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ModuleCharts({ stats }: ModuleChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div
        className={cn(
          "rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm backdrop-blur-sm",
          "transition-all duration-300 hover:shadow-md lg:col-span-2",
        )}
      >
        <h3 className="mb-4 text-sm font-semibold tracking-tight">Rating distribution</h3>
        {stats.reviewCount === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No ratings yet.</p>
        ) : (
          <ChartContainer config={ratingChartConfig} className="h-[220px] w-full">
            <BarChart
              data={stats.ratingDistribution}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="rating" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stats.ratingDistribution.map((entry, index) => (
                  <Cell
                    key={entry.rating}
                    fill={entry.count > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                    opacity={entry.count > 0 ? 0.85 - index * 0.04 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm backdrop-blur-sm",
          "transition-all duration-300 hover:shadow-md",
        )}
      >
        <h3 className="mb-5 text-sm font-semibold tracking-tight">Score overview</h3>
        <div className="space-y-6">
          <ScoreGauge
            label="Average difficulty"
            value={stats.averageDifficulty}
            colorClass="bg-amber-500"
          />
          <ScoreGauge
            label="Average workload"
            value={stats.averageWorkload}
            colorClass="bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
