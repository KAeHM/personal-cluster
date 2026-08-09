import { expect, test } from "@playwright/test";

test("liveness: /api/health responde ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).status).toBe("ok");
});

test("readiness: /api/ready responde ready (banco acessível)", async ({
  request,
}) => {
  const res = await request.get("/api/ready");
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).status).toBe("ready");
});

test("/api/metrics expõe métricas Prometheus", async ({ request }) => {
  const res = await request.get("/api/metrics");
  expect(res.ok()).toBeTruthy();
  expect(await res.text()).toContain("http_requests_total");
});

test("página de login renderiza o formulário", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Senha" })).toBeVisible();
});
