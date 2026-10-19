import Link from "next/link";
import { Edit } from "lucide-react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileUserInfoClient } from "@/components/auth/profile-user-info";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function getInitials(name: string | null | undefined) {
  return (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-1 flex-col pt-28 pb-16 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-lg">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight">Your profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfileUserInfoClient />

              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/write-review">
                    <Edit className="mr-2 h-4 w-4" />
                    Write a review
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/my-reviews">My reviews</Link>
                </Button>
              </div>

              <SignOutButton />
              <div className="border-t border-border/50 pt-6">
                <DeleteAccountButton />
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Signed in with Google. Sessions remain active for 30 days on this device.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
