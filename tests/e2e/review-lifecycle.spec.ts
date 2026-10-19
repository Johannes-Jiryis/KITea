import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { getPrisma } from "../../lib/prisma";

test("search to module, then authenticated create, edit and delete", async ({ page, context }) => {
  if (process.env.TEST_DATABASE !== "true") throw new Error("Use the disposable test runner.");
  const prisma = getPrisma();
  await prisma.user.create({ data: { id: "e2e-user", name: "Test Student" } });
  await prisma.module.create({
    data: { id: "e2e-module", moduleNumber: "E2E-101", moduleName: "Integration Analysis" },
  });
  await prisma.semester.create({
    data: { id: "e2e-semester", name: "Wintersemester", year: 2026 },
  });
  const token = await encode({
    token: { id: "e2e-user", name: "Test Student", sub: "e2e-user" },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: "authjs.session-token",
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  try {
    await page.goto("/");
    await page.getByRole("combobox", { name: "Search modules by number or name" }).fill("E2E-101");
    await page.getByRole("option").filter({ hasText: "E2E-101" }).click();
    await expect(
      page.getByRole("heading", { name: "Integration Analysis", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Write a review", exact: true }).click();
    await expect(page).toHaveURL(/write-review/);
    await page.getByRole("combobox", { name: "Semester taken", exact: true }).click();
    await page.getByRole("option", { name: "Wintersemester 2026" }).click();
    for (const group of await page.getByRole("radiogroup").all())
      await group.getByRole("button", { name: "4 stars", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Summary / recommendation" })
      .fill("A detailed integration test review for this module.");
    await page.getByRole("button", { name: "Submit review", exact: true }).click();
    await expect(page).toHaveURL(/my-reviews/);
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Summary / recommendation" })
      .fill("An updated detailed review from the browser lifecycle test.");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(
      page.getByText("An updated detailed review from the browser lifecycle test."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.getByText("You haven't written any reviews yet.")).toBeVisible();
    await page.goto("/profile");
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    expect(await prisma.user.findUnique({ where: { id: "e2e-user" } })).not.toBeNull();
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Permanently delete account" })).toBeDisabled();
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
    await dialog.getByRole("button", { name: "Permanently delete account" }).click();
    await expect(page).toHaveURL("/");
    expect(await prisma.user.findUnique({ where: { id: "e2e-user" } })).toBeNull();
    // A previously issued JWT from another browser must no longer authenticate this user.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const session = await context.request.get("/api/auth/session");
    expect(await session.json()).toBeNull();
  } finally {
    await prisma.$disconnect();
  }
});
