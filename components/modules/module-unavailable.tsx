"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ModuleUnavailable() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-2xl font-semibold">Database temporarily unavailable</h1>
      <p className="max-w-md text-muted-foreground">
        We could not connect to load this module. Please try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => router.refresh()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to search</Link>
        </Button>
      </div>
    </main>
  );
}
