import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

/**
 * Métricas no formato Prometheus, expostas em `/api/metrics` para scraping.
 *
 * Usa um `Registry` próprio (não o global) para sobreviver ao HMR em dev sem
 * o erro "metric already registered". Inclui as métricas default do Node
 * (heap, GC, event loop, CPU) mais instrumentos HTTP de aplicação.
 */
type Metrics = {
  registry: Registry;
  httpRequestsTotal: Counter<string>;
  httpRequestDuration: Histogram<string>;
};

let metrics: Metrics | null = null;

function initMetrics(): Metrics {
  const registry = new Registry();
  registry.setDefaultLabels({
    service: process.env.OTEL_SERVICE_NAME ?? "personal-assistence-web",
  });
  collectDefaultMetrics({ register: registry });

  const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total de requisições HTTP tratadas pelos Route Handlers.",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  const httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duração das requisições HTTP em segundos.",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  });

  return { registry, httpRequestsTotal, httpRequestDuration };
}

function getMetrics(): Metrics {
  if (!metrics) {
    metrics = initMetrics();
  }
  return metrics;
}

export function getMetricsRegistry(): Registry {
  return getMetrics().registry;
}

/**
 * Envolve um Route Handler medindo contagem e latência por método/rota/status.
 * O `run` deve sempre resolver com um `Response` (inclusive o de erro), para
 * que o status seja capturado corretamente.
 */
export async function withRouteMetrics(
  method: string,
  route: string,
  run: () => Promise<Response>,
): Promise<Response> {
  const start = performance.now();
  let status = 500;
  try {
    const response = await run();
    status = response.status;
    return response;
  } finally {
    const { httpRequestsTotal, httpRequestDuration } = getMetrics();
    const labels = { method, route, status: String(status) };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (performance.now() - start) / 1000);
  }
}
