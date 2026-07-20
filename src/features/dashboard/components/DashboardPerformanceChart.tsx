import { Info, Sparkles, Target } from "lucide-react";
import {
    roundDashboardScore,
    type DashboardPerformanceSnapshot,
} from "@/features/dashboard/domain";
import { Box, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

const CHART_WIDTH = 620;
const CHART_HEIGHT = 270;
const CHART_PADDING = { bottom: 34, left: 42, right: 12, top: 14 } as const;

function chartPoint(value: number, index: number, valueCount: number) {
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const denominator = Math.max(valueCount - 1, 1);
    const x = CHART_PADDING.left + (index / denominator) * plotWidth;
    const y = CHART_PADDING.top + ((100 - value) / 100) * plotHeight;

    return { x, y };
}

export function buildDashboardLinePoints(values: Array<number | null>): string {
    return values
        .flatMap((value, index) => {
            if (value === null) return [];
            const point = chartPoint(value, index, values.length);
            return [`${point.x.toFixed(2)},${point.y.toFixed(2)}`];
        })
        .join(" ");
}

function ScoreSummaryCard({ summary }: { summary: DashboardPerformanceSnapshot["scoreSummaries"][number] }) {
    const Icon = summary.tone === "roleplay" ? Sparkles : Target;
    const displayedScore = summary.value === null ? null : roundDashboardScore(summary.value);
    const displayedTrend = summary.trend === null ? null : roundDashboardScore(summary.trend);
    const scoreLabel = displayedScore === null ? "Pas encore de score" : `${displayedScore}%`;
    const trendLabel = displayedTrend === null
        ? null
        : displayedTrend === 0
            ? "Stable sur la période précédente"
            : `${displayedTrend > 0 ? "+" : ""}${displayedTrend} pts vs période précédente`;

    return (
        <Box className={uiTokens.dashboard.scoreCard.root}>
            <Box className="flex items-center gap-2.5">
                <Box className={`${uiTokens.dashboard.scoreCard.icon} ${uiTokens.dashboard.scoreCard.tone[summary.tone]}`}>
                    <InlineIcon icon={Icon} className="h-4 w-4" />
                </Box>
                <Text className={uiTokens.dashboard.scoreCard.label}>{summary.label}</Text>
            </Box>
            <Text
                aria-label={`${summary.label}, ${displayedScore === null ? "pas encore de donnée" : `${displayedScore} pour cent`}`}
                className={uiTokens.dashboard.scoreCard.value}
            >
                {scoreLabel}
            </Text>
            {trendLabel && <Text className={uiTokens.dashboard.scoreCard.trend}>{trendLabel}</Text>}
            {summary.sampleSize === 1 && (
                <Tooltip content="Une seule activité terminée permet de calculer cette moyenne pour le moment.">
                    <Text className={uiTokens.dashboard.scoreCard.limited}>Basé sur 1 activité</Text>
                </Tooltip>
            )}
        </Box>
    );
}

export function DashboardPerformanceChart({ snapshot }: { snapshot: DashboardPerformanceSnapshot }) {
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const yTicks = [0, 25, 50, 75, 100];
    const hasChartData = snapshot.series.some((series) => series.values.some((value) => value !== null));

    return (
        <>
            <Box className="grid gap-3 sm:grid-cols-2">
                {snapshot.scoreSummaries.map((summary) => (
                    <ScoreSummaryCard key={summary.tone} summary={summary} />
                ))}
            </Box>

            {hasChartData ? (
                <Box className="mt-5 overflow-hidden">
                    <svg
                        aria-label="Évolution chronologique des scores roleplay et quiz"
                        className="h-auto w-full overflow-visible"
                        role="img"
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    >
                        <title>Évolution chronologique des scores roleplay et quiz</title>
                        {yTicks.map((tick) => {
                            const y = CHART_PADDING.top + ((100 - tick) / 100) * plotHeight;
                            return (
                                <g key={tick}>
                                    <line
                                        className={uiTokens.dashboard.chart.grid}
                                        strokeDasharray={tick === 0 ? undefined : "3 4"}
                                        x1={CHART_PADDING.left}
                                        x2={CHART_WIDTH - CHART_PADDING.right}
                                        y1={y}
                                        y2={y}
                                    />
                                    <text
                                        className={uiTokens.dashboard.chart.axisLabel}
                                        dominantBaseline="middle"
                                        textAnchor="end"
                                        x={CHART_PADDING.left - 8}
                                        y={y}
                                    >
                                        {tick === 0 ? "0" : `${tick} %`}
                                    </text>
                                </g>
                            );
                        })}

                        {snapshot.series.map((series) => {
                            const linePoints = buildDashboardLinePoints(series.values);
                            const scoreCount = series.values.filter((value) => value !== null).length;

                            return (
                                <g className={uiTokens.dashboard.chart[series.tone]} key={series.label}>
                                    {scoreCount > 1 && (
                                        <polyline
                                            fill="none"
                                            points={linePoints}
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="3"
                                        />
                                    )}
                                    {series.values.map((value, index) => {
                                        if (value === null) return null;
                                        const point = chartPoint(value, index, series.values.length);
                                        return (
                                            <circle
                                                aria-label={`${series.label}, ${roundDashboardScore(value)} pour cent`}
                                                cx={point.x}
                                                cy={point.y}
                                                fill="currentColor"
                                                key={`${series.label}-${index}`}
                                                r="5"
                                            />
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {snapshot.chartLabels.map((label, index) => {
                            if (!label) return null;
                            const point = chartPoint(0, index, snapshot.chartLabels.length);
                            return (
                                <text
                                    className={uiTokens.dashboard.chart.axisLabel}
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
            ) : (
                <Box className={uiTokens.dashboard.chart.empty}>Pas encore de score sur cette période.</Box>
            )}

            <Box className="mt-1 flex items-center justify-center gap-6">
                {snapshot.series.map((series) => (
                    <Box className={uiTokens.dashboard.chart.legend} key={series.label}>
                        <span className={`h-3 w-3 rounded-full bg-current ${uiTokens.dashboard.chart[series.tone]}`} />
                        {series.label}
                    </Box>
                ))}
            </Box>

            <table className="sr-only">
                <caption>Données chronologiques des scores du dashboard</caption>
                <thead>
                    <tr>
                        <th>Période</th>
                        {snapshot.series.map((series) => <th key={series.label}>{series.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {snapshot.chartLabels.map((label, index) => (
                        <tr key={`${label}-${index}`}>
                            <th>{label || `Point ${index + 1}`}</th>
                            {snapshot.series.map((series) => (
                                <td key={series.label}>
                                    {series.values[index] === null || series.values[index] === undefined
                                        ? "Aucune donnée"
                                        : roundDashboardScore(series.values[index])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Box className={uiTokens.dashboard.chart.footnote}>
                <Tooltip content="Un score apparaît ici seulement quand l’activité est terminée et que son résultat est disponible.">
                    <span className="inline-flex">
                        <InlineIcon icon={Info} className="mt-0.5 h-3.5 w-3.5" />
                    </span>
                </Tooltip>
                <Text>La moyenne retient le meilleur score par activité distincte. La courbe conserve l’historique réel.</Text>
            </Box>
        </>
    );
}
