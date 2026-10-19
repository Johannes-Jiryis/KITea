import Link from "next/link";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function EditReviewNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pt-24 pb-16">
        <h1 className="text-xl font-semibold">Review not found</h1>
        <p className="text-center text-sm text-muted-foreground">
          This review doesn&apos;t exist or you don&apos;t have permission to edit it.
        </p>
        <Button asChild>
          <Link href="/my-reviews">Back to my reviews</Link>
        </Button>
      </main>
      <Footer />
    </>
  );
}
