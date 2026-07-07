import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock,
    Crosshair,
    FileText,
    MessageSquare,
    Phone,
    ShieldCheck,
    Target,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type { Evaluation, EvaluationStep } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import {
    buildEvaluationScoreDetails,
    progressCompetencies,
    scoreLevel,
    type DimensionKey,
    type ProgressCompetency,
    type RoleplayProgress,
} from "@/features/roleplays/domain";

interface RoleplaySessionReportPrintPageProps {
    evaluation: Evaluation;
    progress: RoleplayProgress;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

const stepIcons: Record<EvaluationStep["icon"], { icon: LucideIcon; tone: string }> = {
    phone: { icon: Phone, tone: "bg-[#E7EDFD] text-[#3B6FD0]" },
    message: { icon: MessageSquare, tone: "bg-[#F3E8FD] text-[#8B2FD6]" },
    shield: { icon: ShieldCheck, tone: "bg-[#E7F9ED] text-[#16A34A]" },
    check: { icon: CheckCircle2, tone: "bg-[#FEECF0] text-[#E11D6B]" },
};

const dimensionIcons: Record<DimensionKey, LucideIcon> = {
    savoir: BookOpen,
    "savoir-faire": Crosshair,
    "savoir-etre": Users,
};

const dimensionTone: Record<DimensionKey, string> = {
    savoir: "bg-[#E7EDFD] text-[#3B6FD0]",
    "savoir-faire": "bg-[#F3E8FD] text-[#8B2FD6]",
    "savoir-etre": "bg-[#E4EDFF] text-[#2563EB]",
};

const scoreLabels = {
    green: "Maîtrisé",
    orange: "À renforcer",
    red: "Prioritaire",
    yellow: "À consolider",
} as const;

function ScoreBadge({ score }: { score: number }) {
    const level = scoreLevel(score);

    return (
        <Text as="span" className={cn(uiTokens.progression.scorePill, uiTokens.progression.level[level].pill)}>
            {score}%
        </Text>
    );
}

function ScoreBar({ score }: { score: number }) {
    const level = scoreLevel(score);

    return (
        <Box className={cn(uiTokens.progress.track, "h-2")}>
            <Box
                className={uiTokens.progress.fillBase}
                style={{ width: `${score}%`, backgroundColor: uiTokens.progression.level[level].fill }}
            />
        </Box>
    );
}

function Section({
    children,
    className,
    eyebrow,
    title,
}: {
    children: ReactNode;
    className?: string;
    eyebrow?: string;
    title: string;
}) {
    return (
        <CardSurface className={cn("pdf-avoid rounded-[18px] border border-[#E9E7FB] p-6 shadow-none", className)}>
            {eyebrow && (
                <Text className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5140F0]">
                    {eyebrow}
                </Text>
            )}
            <Text as="h2" className="mt-1 text-[20px] font-extrabold text-[#111827]">
                {title}
            </Text>
            <Box className="mt-5">{children}</Box>
        </CardSurface>
    );
}

function BulletList({ items, tone = "green" }: { items: string[]; tone?: "green" | "red" | "violet" }) {
    const dotClass = {
        green: "bg-[#16A34A]",
        red: "bg-[#E11D48]",
        violet: "bg-[#5140F0]",
    }[tone];

    if (items.length === 0) {
        return <Text className="text-[13px] font-medium text-[#9CA3AF]">Aucune donnée renseignée.</Text>;
    }

    return (
        <Box className="space-y-2.5">
            {items.map((item) => (
                <Box key={item} className="flex gap-2.5">
                    <Box className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
                    <Text className="text-[13px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <Box className="rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3">
            <Text className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</Text>
            <Text className="mt-1 text-[16px] font-extrabold text-[#111827]">{value}</Text>
        </Box>
    );
}

function Header({
    roleplay,
    session,
}: {
    roleplay: RoleplayItem;
    session: RoleplaySession;
}) {
    const level = scoreLevel(session.score);

    return (
        <Box className="rounded-[24px] bg-[#111827] px-8 py-7 text-white">
            <Box className="flex items-start justify-between gap-6">
                <Box className="min-w-0 flex-1">
                    <Text className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#B9B2F8]">
                        Rapport d'évaluation
                    </Text>
                    <Text as="h1" className="mt-2 text-[30px] font-extrabold leading-tight text-white">
                        Évaluation de la simulation
                    </Text>
                    <Text className="mt-3 max-w-[720px] text-[14px] font-medium leading-6 text-[#D1D5DB]">
                        {roleplay.description}
                    </Text>
                    <Box className="mt-5 flex flex-wrap gap-3 text-[13px] font-semibold text-[#E5E7EB]">
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#B9B2F8]" />
                            {session.date}
                        </Box>
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={Clock} className="h-4 w-4 text-[#B9B2F8]" />
                            {session.duration}
                        </Box>
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={Target} className="h-4 w-4 text-[#B9B2F8]" />
                            {roleplay.detail.method || "Méthode non renseignée"}
                        </Box>
                    </Box>
                </Box>

                <Box className="w-[190px] shrink-0 rounded-[20px] bg-white px-5 py-4 text-center text-[#111827]">
                    <Text className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6B7280]">
                        Score global
                    </Text>
                    <Text className="mt-1 text-[42px] font-black leading-none" style={{ color: uiTokens.progression.level[level].fill }}>
                        {session.score}%
                    </Text>
                    <Text className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold", uiTokens.progression.level[level].pill)}>
                        {scoreLabels[level]}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}

function PersonaSummary({ roleplay }: { roleplay: RoleplayItem }) {
    return (
        <Section eyebrow="Contexte" title="Situation et persona">
            <Box className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
                <Box className="space-y-4">
                    <Box>
                        <Text className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9CA3AF]">
                            Contexte
                        </Text>
                        <Text className="mt-1 text-[13px] font-medium leading-6 text-[#4B5563]">
                            {roleplay.detail.context || "Aucun contexte renseigné."}
                        </Text>
                    </Box>
                    <Box>
                        <Text className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9CA3AF]">
                            Objections attendues
                        </Text>
                        <Text className="mt-1 text-[13px] font-medium leading-6 text-[#4B5563]">
                            {roleplay.detail.objections || "Aucune objection renseignée."}
                        </Text>
                    </Box>
                </Box>
                <Box className="rounded-[16px] border border-[#E5E7EB] bg-[#F8F9FC] p-4 text-center">
                    {roleplay.avatarSrc && (
                        <img
                            alt={roleplay.name}
                            className="mx-auto h-16 w-16 rounded-full border-2 border-[#E9E7FB] object-cover"
                            src={roleplay.avatarSrc}
                        />
                    )}
                    <Text className="mt-3 text-[16px] font-extrabold text-[#111827]">{roleplay.name}</Text>
                    <Text className="mt-1 text-[12px] font-semibold leading-5 text-[#6B7280]">
                        {roleplay.role}
                        <br />
                        {roleplay.company}
                    </Text>
                    <Box className="mt-3 flex justify-center gap-2">
                        <Text as="span" className="rounded-full bg-[#EEF0FE] px-2.5 py-1 text-[11px] font-extrabold text-[#5140F0]">
                            {roleplay.disc}
                        </Text>
                        <Text as="span" className="rounded-full bg-[#F7F8FB] px-2.5 py-1 text-[11px] font-extrabold text-[#374151]">
                            {roleplay.difficulty}
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Section>
    );
}

function ScoreDetails({ evaluation }: { evaluation: Evaluation }) {
    const scoreDetails = buildEvaluationScoreDetails(evaluation);

    return (
        <Section eyebrow="Calcul" title="Détail du score global">
            <Box className="grid gap-3 md:grid-cols-2">
                {scoreDetails.rows.map((row) => (
                    <Box key={`${row.stepNumber}-${row.title}`} className="rounded-[14px] border border-[#E5E7EB] p-4">
                        <Box className="flex items-start justify-between gap-3">
                            <Box>
                                <Text className="text-[12px] font-extrabold text-[#5140F0]">Étape {row.stepNumber}</Text>
                                <Text className="mt-1 text-[14px] font-bold leading-5 text-[#111827]">{row.title}</Text>
                            </Box>
                            <ScoreBadge score={row.score} />
                        </Box>
                        <Box className="mt-3 grid grid-cols-2 gap-3">
                            <Metric label="Poids" value={`${row.poids}%`} />
                            <Metric label="Contribution" value={`${row.contribution.toFixed(1)} pts`} />
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box className="mt-4 flex items-center justify-between rounded-[14px] bg-[#F4F3FE] px-4 py-4">
                <Text className="text-[13px] font-bold text-[#5140F0]">
                    {scoreDetails.hasSourceDetails
                        ? "Calcul issu de la notation de session."
                        : "Calcul fallback avec pondération par étapes."}
                </Text>
                <Text className="text-[24px] font-black text-[#5140F0]">{scoreDetails.total}/100</Text>
            </Box>
        </Section>
    );
}

function Synthesis({ evaluation }: { evaluation: Evaluation }) {
    return (
        <Section eyebrow="Synthèse" title="Synthèse globale">
            <Box className="grid gap-4 md:grid-cols-2">
                <Box className="rounded-[14px] border border-[#E5E7EB] p-4">
                    <Text className="text-[14px] font-extrabold text-[#111827]">Avis du persona IA</Text>
                    <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">{evaluation.personaAvis}</Text>
                </Box>
                <Box className="rounded-[14px] border border-[#E5E7EB] p-4">
                    <Text className="text-[14px] font-extrabold text-[#111827]">Appréciation du coach IA</Text>
                    <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.coachAppreciation}
                    </Text>
                </Box>
            </Box>
            <Box className="mt-4 grid gap-4 md:grid-cols-2">
                <Box className="rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
                    <Text className="text-[14px] font-extrabold text-[#15803D]">Points positifs</Text>
                    <Box className="mt-3">
                        <BulletList items={evaluation.pointsPositifs} />
                    </Box>
                </Box>
                <Box className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] p-4">
                    <Text className="text-[14px] font-extrabold text-[#DC2626]">Axes d'amélioration</Text>
                    <Box className="mt-3">
                        <BulletList items={evaluation.axesAmelioration} tone="red" />
                    </Box>
                </Box>
            </Box>
            <Box className="mt-4 rounded-[14px] border border-[#E9E7FB] bg-[#F8F7FF] p-4">
                <Text className="text-[14px] font-extrabold text-[#5140F0]">Priorité stratégique</Text>
                <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">
                    {evaluation.prioriteStrategique}
                </Text>
            </Box>
        </Section>
    );
}

function ProgressSummary({ progress }: { progress: RoleplayProgress }) {
    const competencies = progressCompetencies(progress);

    return (
        <Section eyebrow="Progression" title="Détail de ma progression">
            <Box className="grid gap-3 md:grid-cols-4">
                <Metric label="Score de maîtrise" value={`${progress.masteryScore}%`} />
                <Metric label="Score initial" value={`${progress.initialScore}%`} />
                <Metric label="Après training" value={`${progress.afterTraining}%`} />
                <Metric label="Delta" value={`${progress.delta >= 0 ? "+" : ""}${progress.delta}%`} />
            </Box>
            <Box className="mt-5 grid gap-3 md:grid-cols-3">
                {progress.dimensions.map((dimension) => (
                    <Box key={dimension.key} className="rounded-[14px] border border-[#E5E7EB] p-4">
                        <Box className="flex items-center justify-between gap-3">
                            <Box className="flex items-center gap-2">
                                <Box className={cn("flex h-9 w-9 items-center justify-center rounded-lg", dimensionTone[dimension.key])}>
                                    <InlineIcon icon={dimensionIcons[dimension.key]} className="h-4 w-4" />
                                </Box>
                                <Box>
                                    <Text className="text-[14px] font-bold text-[#111827]">{dimension.label}</Text>
                                    <Text className="text-[12px] font-medium text-[#9CA3AF]">{dimension.subtitle}</Text>
                                </Box>
                            </Box>
                            <ScoreBadge score={dimension.score} />
                        </Box>
                        <Box className="mt-3">
                            <ScoreBar score={dimension.score} />
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box className="mt-5 grid gap-4 md:grid-cols-2">
                <Box className="rounded-[14px] border border-[#E5E7EB] p-4">
                    <Text className="text-[14px] font-extrabold text-[#111827]">Modalités d'évaluation</Text>
                    <Box className="mt-3 space-y-3">
                        {progress.modalities.map((modality) => (
                            <Box key={modality.label}>
                                <Box className="flex items-center justify-between gap-3">
                                    <Text className="text-[13px] font-bold text-[#374151]">{modality.label}</Text>
                                    <Text className="text-[13px] font-extrabold text-[#5140F0]">{modality.score}%</Text>
                                </Box>
                                <Text className="mt-1 text-[12px] font-medium leading-5 text-[#6B7280]">
                                    {modality.description}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box className="rounded-[14px] border border-[#E5E7EB] p-4">
                    <Text className="text-[14px] font-extrabold text-[#111827]">Compétences consolidées</Text>
                    <Box className="mt-3 space-y-3">
                        {competencies.slice(0, 8).map((competency) => (
                            <Box key={competency.name}>
                                <Box className="flex items-center justify-between gap-3">
                                    <Text className="truncate text-[13px] font-bold text-[#374151]">{competency.name}</Text>
                                    <Text className="text-[13px] font-extrabold text-[#5140F0]">{competency.score}%</Text>
                                </Box>
                                <ScoreBar score={competency.score} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Section>
    );
}

function PlanProgress({ evaluation }: { evaluation: Evaluation }) {
    const plans = evaluation.planEtapes ?? [evaluation.planEtape];

    return (
        <Section eyebrow="Plan" title="Plan de progrès">
            <Box className="space-y-4">
                {plans.map((plan) => (
                    <Box key={`${plan.number}-${plan.title}`} className="rounded-[14px] border border-[#E9E7FB] bg-[#F8F7FF] p-4">
                        <Text className="text-[12px] font-extrabold text-[#5140F0]">
                            Étape {plan.number} • {plan.title}
                        </Text>
                        <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">{plan.text}</Text>
                    </Box>
                ))}
            </Box>
        </Section>
    );
}

function StepAnalysis({ evaluation }: { evaluation: Evaluation }) {
    return (
        <Section className="pdf-break" eyebrow="Méthodologie" title="Analyse méthodologique">
            <Box className="space-y-5">
                {evaluation.steps.map((step) => {
                    const icon = stepIcons[step.icon];

                    return (
                        <Box key={step.number} className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-5">
                            <Box className="flex items-start justify-between gap-4">
                                <Box className="flex items-start gap-3">
                                    <Box className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", icon.tone)}>
                                        <InlineIcon icon={icon.icon} className="h-5 w-5" />
                                    </Box>
                                    <Box>
                                        <Text className="text-[12px] font-extrabold text-[#5140F0]">Étape {step.number}</Text>
                                        <Text as="h3" className="mt-0.5 text-[16px] font-extrabold text-[#111827]">
                                            {step.title}
                                        </Text>
                                    </Box>
                                </Box>
                                <Box className="text-right">
                                    <ScoreBadge score={step.score} />
                                    <Text className="mt-1 text-[12px] font-bold text-[#6B7280]">{step.status}</Text>
                                </Box>
                            </Box>

                            {step.commentaireCoach && (
                                <Box className="mt-4 rounded-[12px] border border-[#C2D8FD] bg-[#EFF4FF] p-4">
                                    <Text className="text-[13px] font-extrabold text-[#2563EB]">Commentaire du coach</Text>
                                    <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">
                                        {step.commentaireCoach}
                                    </Text>
                                </Box>
                            )}

                            <Box className="mt-4 grid gap-4 md:grid-cols-2">
                                <Box className="rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
                                    <Text className="text-[13px] font-extrabold text-[#15803D]">Critères réussis</Text>
                                    <Box className="mt-2">
                                        <BulletList items={step.criteresReussis ?? []} />
                                    </Box>
                                </Box>
                                <Box className="rounded-[12px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
                                    <Text className="text-[13px] font-extrabold text-[#C2410C]">Critères à améliorer</Text>
                                    <Box className="mt-2">
                                        <BulletList items={step.criteresAAmeliorer ?? []} tone="red" />
                                    </Box>
                                </Box>
                            </Box>

                            <Box className="mt-4 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="bg-[#F7F8FB] text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#6B7280]">
                                            <th className="w-[23%] px-3 py-2">Critère</th>
                                            <th className="w-[10%] px-3 py-2">Points</th>
                                            <th className="w-[22%] px-3 py-2">Preuves attendues</th>
                                            <th className="w-[25%] px-3 py-2">Analyse</th>
                                            <th className="w-[20%] px-3 py-2">Conseil</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {step.criteria.map((criterion) => (
                                            <tr key={criterion.critere} className="border-t border-[#ECEEF3] align-top text-[11px]">
                                                <td className="px-3 py-3 font-bold leading-5 text-[#111827]">
                                                    {criterion.critere}
                                                    {criterion.competence && (
                                                        <Text className="mt-1 text-[10px] font-semibold text-[#9CA3AF]">
                                                            {criterion.competence}
                                                        </Text>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-extrabold text-[#B45309]">{criterion.points}</td>
                                                <td className="px-3 py-3 font-medium leading-5 text-[#4B5563]">
                                                    {criterion.preuvesAttendues}
                                                </td>
                                                <td className="px-3 py-3 font-medium leading-5 text-[#4B5563]">{criterion.analyse}</td>
                                                <td className="px-3 py-3 font-medium leading-5 text-[#5140F0]">{criterion.conseils}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>

                            {step.reformulations && step.reformulations.length > 0 && (
                                <Box className="mt-4 rounded-[12px] border border-[#E9E7FB] bg-[#FAF9FF] p-4">
                                    <Text className="text-[13px] font-extrabold text-[#5140F0]">Reformulations proposées</Text>
                                    <Box className="mt-3 space-y-3">
                                        {step.reformulations.map((reformulation, index) => (
                                            <Box key={`${reformulation.original}-${index}`}>
                                                <Text className="text-[12px] font-bold text-[#6B7280]">
                                                    « {reformulation.original} »
                                                </Text>
                                                <Text className="mt-1 text-[13px] font-medium leading-6 text-[#1F7A3D]">
                                                    « {reformulation.suggestion} »
                                                </Text>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Section>
    );
}

function ProgressSteps({ progress }: { progress: RoleplayProgress }) {
    return (
        <Section eyebrow="Progression" title="Progression par étapes et compétences">
            <Box className="space-y-4">
                {progress.steps.map((step) => (
                    <Box key={step.number} className="pdf-avoid rounded-[14px] border border-[#E5E7EB] p-4">
                        <Box className="flex items-start justify-between gap-4">
                            <Box>
                                <Text className="text-[12px] font-extrabold text-[#5140F0]">Étape {step.number}</Text>
                                <Text className="mt-1 text-[15px] font-extrabold text-[#111827]">{step.title}</Text>
                                <Text className="mt-2 text-[12px] font-medium leading-5 text-[#4B5563]">{step.diagnostic}</Text>
                            </Box>
                            <ScoreBadge score={step.score} />
                        </Box>
                        <Box className="mt-4 grid gap-3 md:grid-cols-2">
                            {step.competencies.map((competency) => (
                                <CompetencyCard key={competency.name} competency={competency} />
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Section>
    );
}

function CompetencyCard({ competency }: { competency: ProgressCompetency }) {
    return (
        <Box className="rounded-[12px] border border-[#EEF0F4] bg-[#FBFBFD] p-4">
            <Box className="flex items-start justify-between gap-3">
                <Text className="text-[13px] font-extrabold leading-5 text-[#111827]">{competency.name}</Text>
                <ScoreBadge score={competency.score} />
            </Box>
            <Box className="mt-3">
                <ScoreBar score={competency.score} />
            </Box>
            <Box className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="Initial" value={`${competency.initial}%`} />
                <Metric label="Après" value={`${competency.afterTraining}%`} />
                <Metric label="Delta" value={`${competency.delta >= 0 ? "+" : ""}${competency.delta}%`} />
            </Box>
            <Box className="mt-3 space-y-2">
                {competency.dimensions.map((dimension) => (
                    <Box key={dimension.key} className="flex items-start justify-between gap-3">
                        <Text className="text-[12px] font-bold text-[#4B5563]">{dimension.label}</Text>
                        <Text className="text-[12px] font-extrabold text-[#5140F0]">{dimension.score}%</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function DiscourseAndTranscript({ evaluation, roleplay }: { evaluation: Evaluation; roleplay: RoleplayItem }) {
    return (
        <Section className="pdf-break" eyebrow="Discours" title="Analyse discours et transcription">
            <Box className="grid gap-3 md:grid-cols-3">
                {evaluation.discourse.map((metric) => (
                    <Box key={metric.title} className="rounded-[14px] border border-[#E5E7EB] p-4">
                        <Text className="text-[12px] font-bold text-[#6B7280]">{metric.title}</Text>
                        <Text className="mt-2 text-[24px] font-black text-[#111827]">{metric.value}</Text>
                        {metric.subtitle && (
                            <Text className="mt-2 text-[12px] font-medium leading-5 text-[#6B7280]">{metric.subtitle}</Text>
                        )}
                    </Box>
                ))}
            </Box>

            <Box className="mt-5 rounded-[14px] border border-[#E5E7EB] p-4">
                <Box className="flex items-center gap-2">
                    <InlineIcon icon={FileText} className="h-4 w-4 text-[#5140F0]" />
                    <Text className="text-[14px] font-extrabold text-[#111827]">Transcription</Text>
                </Box>
                <Box className="mt-4 space-y-3">
                    {evaluation.transcript.length === 0 ? (
                        <Text className="text-[13px] font-medium text-[#9CA3AF]">Aucune transcription disponible.</Text>
                    ) : (
                        evaluation.transcript.map((message, index) => {
                            const isPersona = message.speaker === "persona";

                            return (
                                <Box key={`${message.time}-${index}`} className="rounded-[12px] bg-[#F7F8FB] px-4 py-3">
                                    <Box className="flex items-center justify-between gap-3">
                                        <Text className="text-[12px] font-extrabold text-[#111827]">
                                            {isPersona ? roleplay.name : "Apprenant"}
                                        </Text>
                                        <Text className="text-[11px] font-bold text-[#9CA3AF]">{message.time}</Text>
                                    </Box>
                                    <Text className="mt-1 text-[13px] font-medium leading-6 text-[#4B5563]">{message.text}</Text>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>
        </Section>
    );
}

export function RoleplaySessionReportPrintPage({
    evaluation,
    progress,
    roleplay,
    session,
}: RoleplaySessionReportPrintPageProps) {
    return (
        <Box className="min-h-screen bg-[#F3F4F8] px-6 py-8 text-[#111827] print:bg-white print:p-0">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @page { size: A4; margin: 12mm; }
                        @media print {
                            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            body { background: white !important; }
                            .pdf-sheet { box-shadow: none !important; padding: 0 !important; max-width: none !important; }
                            .pdf-avoid { break-inside: avoid; page-break-inside: avoid; }
                            .pdf-break { break-before: page; page-break-before: always; }
                        }
                    `,
                }}
            />
            <Box className="pdf-sheet mx-auto max-w-[1120px] space-y-5 rounded-[28px] bg-white p-8 shadow-[0_24px_70px_rgba(17,24,39,0.10)]">
                <Header roleplay={roleplay} session={session} />
                <Box className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                    <PersonaSummary roleplay={roleplay} />
                    <ScoreDetails evaluation={evaluation} />
                </Box>
                <Synthesis evaluation={evaluation} />
                <PlanProgress evaluation={evaluation} />
                <ProgressSummary progress={progress} />
                <StepAnalysis evaluation={evaluation} />
                <ProgressSteps progress={progress} />
                <DiscourseAndTranscript evaluation={evaluation} roleplay={roleplay} />
            </Box>
        </Box>
    );
}
