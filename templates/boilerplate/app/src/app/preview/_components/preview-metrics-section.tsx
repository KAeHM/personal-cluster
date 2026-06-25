import { DollarSignIcon, PercentIcon, UsersIcon } from "lucide-react";
import { StatCard } from "@/common/components/patterns/stat-card";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { fetchPreviewMetrics } from "../_lib/fetch-preview-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function PreviewMetricsSection() {
  const metrics = await fetchPreviewMetrics();

  return (
    <section id="metrics" className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Métricas</PageHeaderTitle>
          <PageHeaderDescription>
            Dados carregados por um server component com delay simulado de API.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Usuários ativos"
          value={metrics.activeUsers.toLocaleString("pt-BR")}
          icon={<UsersIcon />}
          delta={{
            value: metrics.deltas.activeUsers,
            trend: "up",
            label: "vs. mês anterior",
          }}
        />
        <StatCard
          label="Receita"
          value={formatCurrency(metrics.revenue)}
          icon={<DollarSignIcon />}
          delta={{
            value: metrics.deltas.revenue,
            trend: "up",
            label: "vs. mês anterior",
          }}
        />
        <StatCard
          label="Conversão"
          value={`${metrics.conversionRate}%`}
          icon={<PercentIcon />}
          delta={{
            value: metrics.deltas.conversionRate,
            trend: "down",
            label: "vs. mês anterior",
          }}
        />
      </div>
    </section>
  );
}
