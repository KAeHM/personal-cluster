import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import {
  buildReportFilename,
  buildReportPdfBuffer,
} from "@/lib/dashboard/build-report-pdf";
import { formatDateRangeLabel } from "@/lib/dashboard/date-range";
import {
  formatContextFilterSummary,
  parseDashboardFilters,
} from "@/lib/dashboard/filters";
import { getReportExportData } from "@/lib/dashboard/queries";
import { listWorkGroupsForUser } from "@/lib/groups/queries";

const ROUTE = "/api/dashboard/export";

export async function GET(request: Request) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { searchParams } = new URL(request.url);
      const filters = parseDashboardFilters(searchParams);
      const data = await getReportExportData(user.id, user.timezone, filters);

      const contexts = await listWorkGroupsForUser(user.id);
      const filterSummary = formatContextFilterSummary(
        filters.groupIds,
        contexts.map((group) => ({ id: group.id, label: group.label })),
      );

      const filterParts = [
        filterSummary,
        filters.search ? `Busca: ${filters.search}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const pdfBuffer = await buildReportPdfBuffer({
        userName: user.name ?? user.email ?? null,
        periodLabel: formatDateRangeLabel(filters, user.timezone),
        filterSummary: filterParts || null,
        periodMinutes: data.periodMinutes,
        chart: data.chart,
        tasks: data.tasks,
        timezone: user.timezone,
        generatedAt: new Date(),
      });

      const filename = buildReportFilename(data.periodLabel);

      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}
