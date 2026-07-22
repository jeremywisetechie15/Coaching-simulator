import {
    ADMIN_DASHBOARD_ACTIVITY_SERIES_ID,
    type AdminDashboardActivityChart as AdminDashboardActivityChartData,
    type AdminDashboardActivitySeriesId,
} from "@/features/admin-dashboard/domain";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 244;
const CHART_PADDING = { bottom: 34, left: 42, right: 14, top: 12 } as const;

const seriesClasses: Record<AdminDashboardActivitySeriesId, string> = {
    [ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.connections]: uiTokens.adminDashboard.chart.connections,
    [ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.quizzes]: uiTokens.adminDashboard.chart.quizzes,
    [ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.roleplays]: uiTokens.adminDashboard.chart.roleplays,
};

function niceMaximum(value: number) {
    if (value <= 5) return 5;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    return Math.ceil(value / magnitude) * magnitude;
}

function chartPoint(value: number, index: number, valueCount: number, maximum: number) {
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const x = CHART_PADDING.left + (index / Math.max(valueCount - 1, 1)) * plotWidth;
    const y = CHART_PADDING.top + ((maximum - value) / maximum) * plotHeight;
    return { x, y };
}

export function buildAdminDashboardLinePoints(values: number[], maximum: number) {
    return values.map((value, index) => {
        const point = chartPoint(value, index, values.length, maximum);
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(" ");
}

export function AdminDashboardActivityChart({ data }: { data: AdminDashboardActivityChartData }) {
    const maximum = niceMaximum(Math.max(0, ...data.series.flatMap((series) => series.values)));
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maximum * ratio));
    const hasData = data.series.some((series) => series.values.some((value) => value > 0));

    if (!hasData) {
        return <Box className={uiTokens.adminDashboard.chart.empty}>Aucune activité sur cette période.</Box>;
    }

    return (
        <>
            <Box className="mt-2 overflow-hidden">
                <svg
                    aria-label="Évolution de l’activité de la plateforme"
                    className="h-auto w-full overflow-visible"
                    role="img"
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                >
                    <title>Évolution de l’activité de la plateforme</title>
                    {ticks.map((tick) => {
                        const y = CHART_PADDING.top + ((maximum - tick) / maximum) * plotHeight;
                        return (
                            <g key={tick}>
                                <line
                                    className={uiTokens.adminDashboard.chart.grid}
                                    strokeDasharray={tick === 0 ? undefined : "3 4"}
                                    x1={CHART_PADDING.left}
                                    x2={CHART_WIDTH - CHART_PADDING.right}
                                    y1={y}
                                    y2={y}
                                />
                                <text
                                    className={uiTokens.adminDashboard.chart.axisLabel}
                                    dominantBaseline="middle"
                                    textAnchor="end"
                                    x={CHART_PADDING.left - 8}
                                    y={y}
                                >
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {data.series.map((series) => (
                        <g className={seriesClasses[series.id]} key={series.id}>
                            {series.values.length > 1 && (
                                <polyline
                                    fill="none"
                                    points={buildAdminDashboardLinePoints(series.values, maximum)}
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                />
                            )}
                            {series.values.map((value, index) => {
                                const point = chartPoint(value, index, series.values.length, maximum);
                                return (
                                    <circle
                                        aria-label={`${series.label}, ${value}`}
                                        cx={point.x}
                                        cy={point.y}
                                        fill="currentColor"
                                        key={`${series.id}-${index}`}
                                        r="3.5"
                                    />
                                );
                            })}
                        </g>
                    ))}

                    {data.labels.map((label, index) => {
                        if (!label) return null;
                        const point = chartPoint(0, index, data.labels.length, maximum);
                        return (
                            <text
                                className={uiTokens.adminDashboard.chart.axisLabel}
                                key={`${label}-${index}`}
                                textAnchor="middle"
                                x={point.x}
                                y={CHART_HEIGHT - 8}
                            >
                                {label}
                            </text>
                        );
                    })}
                </svg>
            </Box>
            <Box className="flex flex-wrap items-center justify-center gap-7">
                {data.series.map((series) => (
                    <Box className={uiTokens.adminDashboard.chart.legend} key={series.id}>
                        <span className={`h-2.5 w-2.5 rounded-full bg-current ${seriesClasses[series.id]}`} />
                        {series.label}
                    </Box>
                ))}
            </Box>
            <table className="sr-only">
                <caption>Données d’activité de la plateforme</caption>
                <thead>
                    <tr>
                        <th>Période</th>
                        {data.series.map((series) => <th key={series.id}>{series.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.labels.map((label, index) => (
                        <tr key={`${label}-${index}`}>
                            <th>{label || `Point ${index + 1}`}</th>
                            {data.series.map((series) => <td key={series.id}>{series.values[index] ?? 0}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
