import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getReviewForEdit, getReviewFormOptions } from "@/app/actions/reviews";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ReviewForm } from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type EditReviewPageProps = {
  params: Promise<{ reviewId: string }>;
};

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const { reviewId } = await params;
  const editData = await getReviewForEdit(reviewId);

  if (!editData) {
    notFound();
  }
  const options = await getReviewFormOptions(editData.review.moduleId);

  return (
    <AuthGuard>
      <EditReviewContent options={options} reviewId={reviewId} editData={editData} />
    </AuthGuard>
  );
}

function EditReviewContent({
  options,
  reviewId,
  editData,
}: {
  options: Awaited<ReturnType<typeof getReviewFormOptions>>;
  reviewId: string;
  editData: NonNullable<Awaited<ReturnType<typeof getReviewForEdit>>>;
}) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-1 flex-col pt-28 pb-20 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <header className="space-y-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
              <Link href="/my-reviews">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                My reviews
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit review</h1>
              <p className="text-sm text-muted-foreground">
                Update your review for{" "}
                <span className="font-medium text-foreground">{editData.moduleLabel}</span>.
              </p>
            </div>
          </header>

          <ReviewForm
            options={options}
            mode="edit"
            reviewId={reviewId}
            initialValues={editData.review}
            moduleLabel={editData.moduleLabel}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
