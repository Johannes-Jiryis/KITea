import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function ModuleNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center pt-24">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold">Module not found</h1>
          <p className="mb-8 text-muted-foreground">
            We couldn&apos;t find the module you&apos;re looking for. It may have been removed or
            the URL might be incorrect.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to search
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
