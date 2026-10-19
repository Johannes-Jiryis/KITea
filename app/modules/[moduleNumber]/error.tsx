"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ModuleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-2xl font-semibold">Unable to load this module</h1>
      <p className="max-w-md text-muted-foreground">
        The module could not be loaded right now. Please try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to search</Link>
        </Button>
      </div>
    </main>
  );
}
