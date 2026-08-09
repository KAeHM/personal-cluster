import { expect, test } from "@playwright/test";

// Depende dos usuários do seed (`make db-seed`): mestre.taeria@camp.dev
test("login com credenciais do seed redireciona para /studio", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("mestre.taeria@camp.dev");
  await page.getByRole("textbox", { name: "Senha" }).fill("MestreTaeria!726");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/studio");
  await expect(page).toHaveURL(/\/studio$/);
});

test("jogador autenticado não acessa /studio", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("lyra.vento@camp.dev");
  await page.getByRole("textbox", { name: "Senha" }).fill("JogadorTaeria!837");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/wiki");
  await expect(page).toHaveURL(/\/wiki$/);

  await page.goto("/studio");
  await page.waitForURL("**/");
  await expect(page).toHaveURL(/\/$/);
});

test("credenciais inválidas mostram mensagem de erro", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("mestre.taeria@camp.dev");
  await page.getByRole("textbox", { name: "Senha" }).fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
});
