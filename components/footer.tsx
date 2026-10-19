import Link from "next/link";
import { Coffee } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <Link href="/" className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-secondary" />
            <span className="text-lg font-medium">
              <span className="text-primary">KI</span>
              <span className="text-secondary">Tea</span>
            </span>
          </Link>

          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Spill your tea about modules
            <br />
            Made by students, for students.
          </p>
        </div>
      </div>
    </footer>
  );
}
