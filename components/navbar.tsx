"use client";

import Link from "next/link";
import { usePreferenceTheme } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import { Coffee, Menu, Moon, Sun } from "lucide-react";

import { AuthButtonSkeleton } from "@/components/auth/auth-button-skeleton";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { theme, setTheme } = usePreferenceTheme();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isAuthed = status === "authenticated" && user;
  const isLoading = status === "loading";

  const ThemeToggleButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10 text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );

  const AuthControl = isLoading ? (
    <AuthButtonSkeleton />
  ) : isAuthed ? (
    <ProfileMenu user={user} />
  ) : (
    <SignInButton />
  );

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Coffee className="h-10 w-10 text-secondary" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-primary">KI</span>
              <span className="text-secondary">Tea</span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            {ThemeToggleButton}
            {AuthControl}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>KITea</SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">{ThemeToggleButton}</div>

                  <div className="border-t border-border/50 pt-4">
                    {isLoading ? (
                      <AuthButtonSkeleton />
                    ) : isAuthed ? (
                      <ProfileMenu user={user} showLabel={false} />
                    ) : (
                      <SignInButton className="w-full justify-center" variant="outline" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {isAuthed
                      ? `Signed in as ${user.name ?? "student"}`
                      : "Sign in to write and manage reviews."}
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
