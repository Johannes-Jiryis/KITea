import { getReviewFormOptions } from "@/app/actions/reviews";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ReviewForm } from "@/components/reviews/review-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export const dynamic = "force-dynamic";

type WriteReviewPageProps = {
  searchParams: Promise<{ moduleId?: string }>;
};

export default async function WriteReviewPage({ searchParams }: WriteReviewPageProps) {
  const params = await searchParams;
  const options = await getReviewFormOptions(params.moduleId);

  const selectedModule = params.moduleId
    ? options.modules.find((module) => module.id === params.moduleId)
    : undefined;

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex min-h-screen flex-1 flex-col pt-28 pb-20 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <header className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Write a review</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Share your experience to help fellow KIT students.
              </p>
            </header>

            <ReviewForm
              options={options}
              mode="create"
              defaultModuleId={params.moduleId}
              moduleLabel={selectedModule?.label}
            />
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
