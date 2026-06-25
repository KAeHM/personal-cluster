export type PreviewMetrics = {
  activeUsers: number;
  revenue: number;
  conversionRate: number;
  deltas: {
    activeUsers: number;
    revenue: number;
    conversionRate: number;
  };
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Emula uma requisição de API para métricas do dashboard. */
export async function fetchPreviewMetrics(): Promise<PreviewMetrics> {
  await delay(1200);

  return {
    activeUsers: 1284,
    revenue: 48200,
    conversionRate: 3.8,
    deltas: {
      activeUsers: 12,
      revenue: 8,
      conversionRate: -2,
    },
  };
}
