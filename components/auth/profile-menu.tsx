"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Edit, List, LogOut, User } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ProfileMenuUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function getInitials(name: string | null | undefined) {
  return (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type ProfileMenuProps = {
  user: ProfileMenuUser;
  className?: string;
  showLabel?: boolean;
};

export function ProfileMenu({ user, className, showLabel = true }: ProfileMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setIsSigningOut(false);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Please try again.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={isSigningOut}
          className={cn(
            "h-9 gap-2 px-2 text-muted-foreground hover:text-foreground sm:px-3",
            className,
          )}
        >
          {showLabel && (
            <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
              {user.name?.split(" ")[0] ?? "Profile"}
            </span>
          )}
          <Avatar className="h-7 w-7 ring-1 ring-border/50">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-foreground">{user.name ?? "Student"}</p>
            {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            View profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/write-review" className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Write a review
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-reviews" className="cursor-pointer">
            <List className="mr-2 h-4 w-4" />
            My reviews
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
