"use client";

import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

export const MarkdownPreview = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  if (!content.trim())
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Nothing to preview yet.
      </p>
    );
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none space-y-3 text-foreground",
        className,
      )}
    >
      <Markdown
        skipHtml
        disallowedElements={["img"]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
