import { registerOTel } from "@vercel/otel";
import type { Instrumentation } from "next";

import { initLogger } from "@/common/adapters/logger";
import { logError } from "@/common/errors";

export function registerInstrumentation(): void {
  if (process.env.OTEL_SDK_DISABLED === "true") {
    initLogger();
    return;
  }

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "personal-assistence-web",
  });

  initLogger();
}

export const handleRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const requestIdHeader = request.headers["x-request-id"];
  const requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;

  const err = error as Error & { digest?: string };

  logError(err, {
    requestId,
    digest: err.digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });
};
