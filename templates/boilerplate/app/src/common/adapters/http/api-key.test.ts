import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.fn();

vi.mock("@/common/env", () => ({
  getEnv: () => getEnv(),
}));

import { isValidApiKey } from "./api-key";

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/v1/users", { headers });
}

beforeEach(() => {
  getEnv.mockReset();
});

describe("isValidApiKey", () => {
  it("nega quando API_KEY não está configurada (fail-closed)", () => {
    getEnv.mockReturnValue({ API_KEY: undefined });
    expect(isValidApiKey(request({ "x-api-key": "qualquer" }))).toBe(false);
  });

  it("aceita o header x-api-key correto", () => {
    getEnv.mockReturnValue({ API_KEY: "secret" });
    expect(isValidApiKey(request({ "x-api-key": "secret" }))).toBe(true);
  });

  it("aceita Authorization: Bearer", () => {
    getEnv.mockReturnValue({ API_KEY: "secret" });
    expect(isValidApiKey(request({ authorization: "Bearer secret" }))).toBe(
      true,
    );
  });

  it("nega quando a chave está errada", () => {
    getEnv.mockReturnValue({ API_KEY: "secret" });
    expect(isValidApiKey(request({ "x-api-key": "errada" }))).toBe(false);
  });
});
