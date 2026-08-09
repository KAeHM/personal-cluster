import { expect, test } from "@playwright/test";

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/wiki");
}

// Depende do seed (`make db-seed`): usuários + kinds. Entradas do codex
// são criadas no Studio — estes testes não assumem conteúdo demo.
test("jogador autenticado abre o hub da wiki", async ({ page }) => {
  await loginAs(page, "lyra.vento@camp.dev", "JogadorTaeria!837");

  await expect(page.getByRole("heading", { name: "Worldbuild" })).toBeVisible();
});

test("redirect legado ?kind= aponta para browse do tipo", async ({ page }) => {
  await loginAs(page, "lyra.vento@camp.dev", "JogadorTaeria!837");

  await page.goto("/wiki?kind=lenda");
  await page.waitForURL("**/wiki/kinds/lenda");
  await expect(page).toHaveURL(/\/wiki\/kinds\/lenda$/);
  await expect(page.getByRole("heading", { name: "Lenda" })).toBeVisible();
});

test("entrada inexistente retorna 404", async ({ page }) => {
  await loginAs(page, "lyra.vento@camp.dev", "JogadorTaeria!837");

  const response = await page.goto("/wiki/entrada-que-nao-existe");
  expect(response?.status()).toBe(404);
});
