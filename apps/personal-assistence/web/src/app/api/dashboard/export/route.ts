import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseDashboardFilters(searchParams);
  const data = await getReportExportData(user.id, user.timezone, filters);

  const contexts = await listWorkGroupsForUser(user.id);
  const filterSummary = formatContextFilterSummary(
    filters.groupIds,
    contexts.map((group) => ({ id: group.id, label: group.label })),
  );

  const filterParts = [filterSummary, filters.search ? `Busca: ${filters.search}` : null]
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

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
