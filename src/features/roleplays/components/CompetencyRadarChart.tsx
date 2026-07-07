import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface RadarAxis {
    label: string;
    value: number;
}

interface CompetencyRadarChartProps {
    axes: RadarAxis[];
    /** Valeur cible (série pointillée, ex. 80). */
    target: number;
    /** Valeur max de l'échelle (100 par défaut). */
    max?: number;
    size?: number;
}

const SCORE_COLOR = "#5140F0";
const TARGET_COLOR = "#F59E0B";
const GRID_RINGS = [20, 40, 60, 80, 100];

/** Coordonnée d'un point sur l'axe `index` à la valeur `value` (repère centré). */
function polar(center: number, radius: number, count: number, index: number, value: number, max: number) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const r = (Math.min(value, max) / max) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}

/** Radar générique à N axes : série « Score actuel » (plein) + série « Cible » (pointillé). */
export function CompetencyRadarChart({ axes, target, max = 100, size = 340 }: CompetencyRadarChartProps) {
    const count = axes.length;
    const center = size / 2;
    const radius = size / 2 - 6;
    const labelRadius = radius + 22;

    const toPoints = (values: number[]) =>
        values.map((v, i) => polar(center, radius, count, i, v, max)).map((p) => `${p.x},${p.y}`).join(" ");

    const scorePoints = toPoints(axes.map((a) => a.value));
    const targetPoints = toPoints(axes.map(() => target));

    return (
        <Box className="relative mx-auto" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* Anneaux de la grille */}
                {GRID_RINGS.map((ring) => (
                    <polygon
                        key={ring}
                        points={toPoints(axes.map(() => ring))}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth={1}
                    />
                ))}
                {/* Rayons */}
                {axes.map((axis, i) => {
                    const p = polar(center, radius, count, i, max, max);
                    return <line key={axis.label} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth={1} />;
                })}
                {/* Série cible (pointillé ambre) */}
                <polygon points={targetPoints} fill={TARGET_COLOR} fillOpacity={0.08} stroke={TARGET_COLOR} strokeWidth={1.5} strokeDasharray="5 4" />
                {/* Série score actuel (indigo plein) */}
                <polygon points={scorePoints} fill={SCORE_COLOR} fillOpacity={0.16} stroke={SCORE_COLOR} strokeWidth={2} />
                {axes.map((axis, i) => {
                    const p = polar(center, radius, count, i, axis.value, max);
                    return <circle key={axis.label} cx={p.x} cy={p.y} r={3.5} fill={SCORE_COLOR} />;
                })}
                {/* Graduations sur l'axe vertical */}
                {GRID_RINGS.slice(0, 4).map((ring) => (
                    <text
                        key={ring}
                        x={center + 6}
                        y={center - (ring / max) * radius + 3}
                        fontSize={9}
                        fill="#9CA3AF"
                        fontWeight={600}
                    >
                        {ring}%
                    </text>
                ))}
            </svg>
            {/* Étiquettes d'axe (pastilles HTML positionnées) */}
            {axes.map((axis, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
                const left = center + labelRadius * Math.cos(angle);
                const top = center + labelRadius * Math.sin(angle);
                return (
                    <Box
                        key={axis.label}
                        className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                        style={{ left, top }}
                    >
                        <Text as="span" className={uiTokens.progression.radarAxisLabel}>
                            {axis.label}
                        </Text>
                    </Box>
                );
            })}
        </Box>
    );
}
