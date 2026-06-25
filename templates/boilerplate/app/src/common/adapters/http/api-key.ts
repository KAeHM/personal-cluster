import { getEnv } from "@/common/env";

const API_KEY_HEADER = "x-api-key";
const BEARER_PREFIX = "Bearer ";

/**
 * Valida a API key de consumo externo (Route Handlers `/api/v1`). Aceita o
 * header `x-api-key` ou `Authorization: Bearer <key>`. Se `API_KEY` não estiver
 * configurada, nega por padrão (fail-closed).
 */
export function isValidApiKey(request: Request): boolean {
  const { API_KEY } = getEnv();
  if (!API_KEY) {
    return false;
  }

  const direct = request.headers.get(API_KEY_HEADER);
  if (direct && direct === API_KEY) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith(BEARER_PREFIX)) {
    return authorization.slice(BEARER_PREFIX.length) === API_KEY;
  }

  return false;
}
