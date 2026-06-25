import { expect, test } from "@playwright/test";

// Depende dos usuários do seed (`make db-seed`): admin@example.com / admin1234.
test("login com credenciais do seed redireciona para /preview", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Senha").fill("admin1234");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/preview");
  await expect(page).toHaveURL(/\/preview$/);
});

test("credenciais inválidas mostram mensagem de erro", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
});
