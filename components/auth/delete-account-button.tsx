"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        setConfirmation("");
        setError("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your KITea account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your KITea account, all your reviews, and your helpful votes.
            This cannot be undone. Your Google account is unaffected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-account-confirmation">Type DELETE to confirm</Label>
          <Input
            id="delete-account-confirmation"
            value={confirmation}
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending || confirmation !== "DELETE"}
            onClick={() => {
              setError("");
              startTransition(async () => {
                try {
                  const result = await deleteAccount(confirmation);
                  if ("error" in result) setError(result.error);
                  else window.location.assign("/");
                } catch {
                  setError(
                    "Could not complete the request. Please reload the page and check your account before trying again.",
                  );
                }
              });
            }}
          >
            {pending ? "Deleting account…" : "Permanently delete account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
