import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignInButtonProps = {
  callbackUrl?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline";
};

export function SignInButton({ callbackUrl, className, variant = "ghost" }: SignInButtonProps) {
  const href = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";

  return (
    <Button
      asChild
      variant={variant}
      className={cn(
        "h-9 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Link href={href}>Sign in</Link>
    </Button>
  );
}
