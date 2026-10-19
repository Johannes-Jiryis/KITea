import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReviewFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ReviewFormSection({
  title,
  description,
  children,
  className,
}: ReviewFormSectionProps) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
