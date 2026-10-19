import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { Footer } from "@/components/footer";
import { ModulePageContent } from "@/components/modules/module-page-content";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { getModulePageData } from "@/lib/modules/get-module-page";
import { getModuleByNumber } from "@/lib/modules/get-module";
import { reviewQuerySchema } from "@/lib/modules/review-query";
import { isDatabaseConnectionError } from "@/lib/database/read";
import { ModuleUnavailable } from "@/components/modules/module-unavailable";

export const dynamic = "force-dynamic";

type ModulePageProps = {
  params: Promise<{ moduleNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ModulePageProps) {
  const { moduleNumber } = await params;
  let data;
  try {
    data = await getModuleByNumber(moduleNumber);
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return { title: "Module temporarily unavailable | KITea" };
  }

  if (!data) {
    return { title: "Module not found — KITea" };
  }

  return {
    title: `${data.moduleNumber} ${data.moduleName} — KITea`,
    description: `Reviews and ratings for ${data.moduleName} at KIT.`,
  };
}

export default async function ModulePage({ params, searchParams }: ModulePageProps) {
  const { moduleNumber } = await params;
  const session = await auth();
  const parsed = reviewQuerySchema.safeParse(await searchParams);
  let data;
  try {
    data = await getModulePageData(
      moduleNumber,
      session?.user?.id,
      parsed.success ? parsed.data : reviewQuerySchema.parse({}),
    );
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    console.error(
      JSON.stringify({
        level: "error",
        event: "module.load.unavailable",
        reason: "connection_failure",
      }),
    );
    return <ModuleUnavailable />;
  }

  if (!data) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-1 flex-col pt-28 pb-16 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4 w-fit text-muted-foreground"
          >
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to search
            </Link>
          </Button>

          <ModulePageContent data={data} isAuthenticated={!!session?.user} />
        </div>
      </main>
      <Footer />
    </>
  );
}
