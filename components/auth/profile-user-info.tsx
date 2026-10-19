"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string | null | undefined) {
  return (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProfileUserInfoClient() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 ring-2 ring-border/50">
        <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
        <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-medium">{user.name ?? "Student"}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email ?? "—"}</p>
      </div>
    </div>
  );
}
