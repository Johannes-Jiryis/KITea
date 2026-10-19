import Link from "next/link";
import { Plus } from "lucide-react";

import { getMyReviews } from "@/app/actions/reviews";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MyReviewsList } from "@/components/reviews/my-reviews-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawPage = Number((await searchParams).page || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const reviews = await getMyReviews(page);

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex min-h-screen flex-1 flex-col pt-28 pb-16 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">My reviews</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Edit or delete reviews you&apos;ve submitted.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/write-review">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New review
                </Link>
              </Button>
            </div>

            <MyReviewsList reviews={reviews.slice(0, 20)} />
            <nav aria-label="My review pages" className="flex gap-4">
              {page > 1 && <Link href={`/my-reviews?page=${page - 1}`}>Previous</Link>}
              <span>Page {page}</span>
              {reviews.length > 20 && <Link href={`/my-reviews?page=${page + 1}`}>Next</Link>}
            </nav>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
