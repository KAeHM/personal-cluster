import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("pino");
    await import("next-logger/presets/next-only");
    const { registerInstrumentation } = await import("./instrumentation.node");
    registerInstrumentation();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { handleRequestError } = await import("./instrumentation.node");
    await handleRequestError(error, request, context);
  }
};
