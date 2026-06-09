export type StatHintTone = "positive" | "neutral";

export interface DashboardStat {
    label: string;
    value: string;
    hint: string;
    hintTone: StatHintTone;
}

export type SkillSummaryTone = "weak" | "toReinforce" | "progressing" | "mastered";

export interface SkillSummaryItem {
    label: string;
    count: number;
    total: number;
    tone: SkillSummaryTone;
}

export interface ReplayHighlight {
    roleplayId: string;
    title: string;
    subtitle: string;
    imageSrc: string;
    progress: number;
}

export interface DashboardData {
    pendingActivities: number;
    streakDays: number;
    stats: DashboardStat[];
    skillsSummary: SkillSummaryItem[];
    replayHighlight: ReplayHighlight;
    /** Ids de roleplays (voir roleplays.ts) affichés dans « Mes derniers roleplays ». */
    recentRoleplayIds: string[];
}

export const dashboardData: DashboardData = {
    pendingActivities: 1,
    streakDays: 5,
    stats: [
        { label: "Temps de roleplay", value: "8h 45min", hint: "+15% vs sem. dernière", hintTone: "positive" },
        { label: "Roleplays à faire", value: "3", hint: "Objectif semaine", hintTone: "neutral" },
        { label: "Roleplays en cours", value: "2", hint: "+1 vs sem. dernière", hintTone: "positive" },
        { label: "Roleplays réalisés", value: "20", hint: "+4 ce mois-ci", hintTone: "positive" },
    ],
    skillsSummary: [
        { label: "Faible", count: 1, total: 7, tone: "weak" },
        { label: "À renforcer", count: 2, total: 7, tone: "toReinforce" },
        { label: "En progression", count: 2, total: 7, tone: "progressing" },
        { label: "Maîtrisées", count: 2, total: 7, tone: "mastered" },
    ],
    replayHighlight: {
        roleplayId: "thomas-lion",
        title: "Entretien commercial B2B",
        subtitle: "Roleplay Thomas Lion",
        imageSrc:
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=280&fit=crop",
        progress: 68,
    },
    recentRoleplayIds: ["marc-dubois", "rachid-hamrani"],
};

export const skillSummaryStyles: Record<
    SkillSummaryTone,
    { bg: string; value: string; chipBg: string; chipText: string }
> = {
    weak: { bg: "#FEF2F2", value: "#DC2626", chipBg: "#FEE2E2", chipText: "#B91C1C" },
    toReinforce: { bg: "#FFF7ED", value: "#C2410C", chipBg: "#FFEDD5", chipText: "#9A3412" },
    progressing: { bg: "#FEFCE8", value: "#A16207", chipBg: "#FEF9C3", chipText: "#854D0E" },
    mastered: { bg: "#F0FDF4", value: "#16A34A", chipBg: "#DCFCE7", chipText: "#15803D" },
};
