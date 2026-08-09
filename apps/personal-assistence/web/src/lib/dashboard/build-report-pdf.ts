import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  CanvasElement,
  Content,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import type { DashboardChart, DashboardTask } from "@/lib/dashboard/types";
import { formatMinutes } from "@/lib/format/time";

pdfMake.addVirtualFileSystem(pdfFonts);

const fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const STATUS_LABELS: Record<DashboardTask["status"], string> = {
  active: "Em andamento",
  paused: "Pausada",
  closed: "Finalizada",
};

export type ReportPdfInput = {
  userName: string | null;
  periodLabel: string;
  filterSummary?: string | null;
  periodMinutes: number;
  chart: DashboardChart;
  tasks: DashboardTask[];
  timezone: string;
  generatedAt: Date;
};

function formatDateTimePdf(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function buildDailyChart(points: DashboardChart["points"]): Content {
  if (points.length === 0) {
    return {
      text: "Nenhum tempo registrado neste período.",
      style: "muted",
      margin: [0, 0, 0, 16],
    };
  }

  const chartWidth = 515;
  const chartHeight = 120;
  const labelHeight = 14;
  const maxMinutes = Math.max(...points.map((point) => point.minutes), 1);
  const slotWidth = chartWidth / points.length;
  const barWidth = Math.max(2, slotWidth * 0.65);

  const canvas: CanvasElement[] = [];

  canvas.push({
    type: "line",
    x1: 0,
    y1: chartHeight,
    x2: chartWidth,
    y2: chartHeight,
    lineWidth: 0.5,
    lineColor: "#cccccc",
  });

  for (const [index, point] of points.entries()) {
    const barHeight = (point.minutes / maxMinutes) * (chartHeight - 8);
    const x = index * slotWidth + (slotWidth - barWidth) / 2;
    const y = chartHeight - barHeight;

    if (point.minutes > 0) {
      canvas.push({
        type: "rect",
        x,
        y,
        w: barWidth,
        h: barHeight,
        color: "#2563eb",
      });
    }
  }

  const labelStep =
    points.length <= 10
      ? 1
      : points.length <= 31
        ? 2
        : Math.ceil(points.length / 12);

  const labels = points
    .filter(
      (_, index) => index % labelStep === 0 || index === points.length - 1,
    )
    .map((point) => point.label)
    .join("   ");

  return {
    stack: [
      {
        text: "Horas por dia",
        style: "sectionTitle",
        margin: [0, 0, 0, 8],
      },
      {
        canvas,
      },
      {
        text: labels,
        style: "chartLabels",
        margin: [0, 4, 0, 16],
      },
    ],
  };
}

function buildTasksTable(tasks: DashboardTask[], timezone: string): Content {
  const header = [
    { text: "Descrição", style: "tableHeader" },
    { text: "Contexto", style: "tableHeader" },
    { text: "Início", style: "tableHeader" },
    { text: "Término", style: "tableHeader" },
    { text: "Duração", style: "tableHeader" },
    { text: "Status", style: "tableHeader" },
  ];

  const body = tasks.map((task) => [
    task.description,
    task.groupLabel ?? "—",
    formatDateTimePdf(task.startedAt, timezone),
    task.endedAt ? formatDateTimePdf(task.endedAt, timezone) : "—",
    task.durationMinutes != null
      ? formatMinutes(Math.round(task.durationMinutes))
      : "—",
    STATUS_LABELS[task.status],
  ]);

  const totalMinutes = tasks.reduce(
    (sum, task) => sum + Math.round(task.durationMinutes ?? 0),
    0,
  );

  return {
    stack: [
      {
        text: `Tarefas (${tasks.length})`,
        style: "sectionTitle",
        margin: [0, 8, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 70, 68, 68, 52, 58],
          body: [
            header,
            ...body,
            [
              {
                text: "Total (tarefas listadas)",
                colSpan: 4,
                style: "tableFooter",
              },
              {},
              {},
              {},
              { text: formatMinutes(totalMinutes), style: "tableFooter" },
              { text: "", style: "tableFooter" },
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? "#f3f4f6" : rowIndex % 2 === 0 ? "#fafafa" : null,
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#e5e7eb",
          vLineColor: () => "#e5e7eb",
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],
  };
}

function buildDocumentDefinition(input: ReportPdfInput): TDocumentDefinitions {
  const generatedLabel = format(input.generatedAt, "d MMM yyyy, HH:mm", {
    locale: ptBR,
  });

  const metaLines: Content[] = [
    { text: input.periodLabel, style: "subtitle" },
    {
      text: `Total no período: ${formatMinutes(input.periodMinutes)}`,
      style: "summary",
      margin: [0, 4, 0, 0],
    },
  ];

  if (input.filterSummary) {
    metaLines.push({
      text: input.filterSummary,
      style: "muted",
      margin: [0, 4, 0, 0],
    });
  }

  metaLines.push({
    text: `Gerado em ${generatedLabel}${input.userName ? ` · ${input.userName}` : ""}`,
    style: "muted",
    margin: [0, 4, 0, 16],
  });

  return {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: "#111827",
    },
    styles: {
      title: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      subtitle: {
        fontSize: 11,
        color: "#374151",
      },
      summary: {
        fontSize: 11,
        bold: true,
      },
      sectionTitle: {
        fontSize: 11,
        bold: true,
        color: "#111827",
      },
      muted: {
        fontSize: 8,
        color: "#6b7280",
      },
      chartLabels: {
        fontSize: 7,
        color: "#6b7280",
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: "#374151",
      },
      tableFooter: {
        bold: true,
        fontSize: 8,
      },
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "Relatório de horas", style: "muted" },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          style: "muted",
        },
      ],
      margin: [40, 0, 40, 24],
    }),
    content: [
      { text: "Relatório de horas", style: "title" },
      ...metaLines,
      buildDailyChart(input.chart.points),
      buildTasksTable(input.tasks, input.timezone),
    ],
  };
}

export async function buildReportPdfBuffer(
  input: ReportPdfInput,
): Promise<Buffer> {
  const docDefinition = buildDocumentDefinition(input);
  pdfMake.setFonts(fonts);
  const pdf = pdfMake.createPdf(docDefinition);
  return pdf.getBuffer();
}

export function buildReportFilename(periodLabel: string): string {
  const slug = periodLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const datePart = format(new Date(), "yyyy-MM-dd");
  return `relatorio-horas-${slug || datePart}.pdf`;
}
