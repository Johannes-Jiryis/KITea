// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { HighlightedText } from "@/components/search/highlighted-text";
import { MarkdownPreview } from "@/components/reviews/markdown-preview";
afterEach(cleanup);

it("renders imported catalog HTML as text, with safe matching marks", () => {
  const text = '<img src=x onerror="alert(1)"> Analysis';
  const { container } = render(<HighlightedText text={text} query="Analysis" />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe(text);
  expect(container.querySelector("mark")?.textContent).toBe("Analysis");
});
it("treats regexp metacharacters literally", () => {
  const { container } = render(<HighlightedText text="Course [x]+ (advanced)" query="[x]+" />);
  expect(container.querySelector("mark")?.textContent).toBe("[x]+");
});
it("blocks raw HTML, javascript URLs, remote images, and attribute injection", () => {
  const { container } = render(
    <MarkdownPreview
      content={
        '<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n[x](https://example.test/"onmouseover="alert(1))\n\n![tracking](https://example.test/pixel)'
      }
    />,
  );
  expect(container.querySelector("img, script, [onmouseover], [onerror]")).toBeNull();
  for (const link of container.querySelectorAll("a"))
    expect(link.getAttribute("href") || "").not.toMatch(/^javascript:/i);
});
it("keeps useful Markdown formatting", () => {
  const { container } = render(
    <MarkdownPreview content="**Useful** [link](https://example.test)" />,
  );
  expect(container.querySelector("strong")?.textContent).toBe("Useful");
  expect(container.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
});
