import {
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock,
    FileText,
    Info,
    MessageSquare,
    Phone,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    discBadgeStyles,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { stepStatusStyles } from "@/features/roleplays/data/evaluation";
import type { Evaluation, EvaluationStep } from "@/features/roleplays/data/evaluation";
import { buildEvaluationScoreDetails } from "@/features/roleplays/domain";

interface RoleplaySessionEvaluationPrintPageProps {
    evaluation: Evaluation;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

const stepIcons: Record<EvaluationStep["icon"], { icon: LucideIcon; bg: string; color: string }> = {
    phone: { icon: Phone, bg: "#E7EDFD", color: "#3B6FD0" },
    message: { icon: MessageSquare, bg: "#F3E8FD", color: "#8B2FD6" },
    shield: { icon: ShieldCheck, bg: "#E7F9ED", color: "#16A34A" },
    check: { icon: CheckCircle2, bg: "#FEECF0", color: "#E11D6B" },
};

function scoreColor(score: number) {
    if (score >= 80) {
        return "#16A34A";
    }
    if (score >= 60) {
        return "#F59E0B";
    }
    return "#F97316";
}

/** Niveau de performance + couleurs, dérivés des seuils de notation (0-40 / 41-65 / 66-85 / 86-100). */
function scoreNiveau(score: number): { label: string; bg: string; text: string } {
    if (score >= 86) {
        return { bg: "#F0FDF4", label: "Excellent", text: "#16A34A" };
    }
    if (score >= 66) {
        return { bg: "#F0FDF4", label: "Bon", text: "#16A34A" };
    }
    if (score >= 41) {
        return { bg: "#FFF7ED", label: "Moyen", text: "#C2410C" };
    }
    return { bg: "#FEF2F2", label: "Faible", text: "#DC2626" };
}

/** Anneau de score SVG (repris de la page d'évaluation, adapté à l'impression). */
function Ring({ score, size = 108, stroke = 11 }: { score: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = scoreColor(score);

    return (
        <Box className="relative" style={{ width: size, height: size }}>
            <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ECEEF3" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <Box className="absolute inset-0 flex items-center justify-center">
                <Text className="text-[22px] font-extrabold" style={{ color }}>
                    {score}%
                </Text>
            </Box>
        </Box>
    );
}

/** Titre de section (bandeau icône + libellé), commun aux 4 grands blocs. */
function SectionTitle({ icon, tone, title }: { icon: LucideIcon; tone: { bg: string; color: string }; title: string }) {
    return (
        <Box className="flex items-center gap-3">
            <Box
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: tone.bg, color: tone.color }}
            >
                <InlineIcon icon={icon} className="h-5 w-5" />
            </Box>
            <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                {title}
            </Text>
        </Box>
    );
}

/** Enveloppe d'une grande section : saut de page optionnel + titre. */
function PrintSection({
    breakBefore = true,
    children,
    icon,
    title,
    tone,
}: {
    breakBefore?: boolean;
    children: ReactNode;
    icon: LucideIcon;
    title: string;
    tone: { bg: string; color: string };
}) {
    return (
        <Box className={cn("space-y-5", breakBefore && "pdf-break")}>
            <SectionTitle icon={icon} tone={tone} title={title} />
            {children}
        </Box>
    );
}

function BulletList({ items, tone }: { items: string[]; tone: "green" | "red" | "violet" }) {
    const dotClass = {
        green: "bg-[#16A34A]",
        red: "bg-[#E11D48]",
        violet: "bg-[#5140F0]",
    }[tone];

    return (
        <Box className="mt-2 space-y-2.5">
            {items.map((item) => (
                <Box key={item} className="flex gap-2.5">
                    <Box className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
                    <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

function CardHeading({ bg, color, icon, title }: { bg: string; color: string; icon: LucideIcon; title: string }) {
    return (
        <Box className="flex items-center gap-3">
            <Box className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg, color }}>
                <InlineIcon icon={icon} className="h-[18px] w-[18px]" />
            </Box>
            <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                {title}
            </Text>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/* En-tête : Situation / Persona / Score + détail du score + méthode   */
/* ------------------------------------------------------------------ */

function ReportHeader({
    evaluation,
    roleplay,
    session,
}: {
    evaluation: Evaluation;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}) {
    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const discStyle = discBadgeStyles[roleplay.disc];
    const niveau = scoreNiveau(session.score);

    return (
        <Box className="pdf-avoid space-y-5">
            <Box>
                <Text className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5140F0]">
                    Rapport d&apos;évaluation
                </Text>
                <Text as="h1" className="mt-1 text-[30px] font-extrabold leading-tight text-[#111827]">
                    Évaluation de la simulation
                </Text>
            </Box>

            <Box className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-[#F7F8FB] px-5 py-4">
                <Box className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-[#4B5563]">
                    <Box className="flex items-center gap-2">
                        <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#9CA3AF]" />
                        Réalisé le {session.date}
                    </Box>
                    <Box className="flex items-center gap-2">
                        <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                        Durée session : {session.duration}
                    </Box>
                </Box>
                <Box
                    className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-bold"
                    style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                >
                    {roleplay.category}
                </Box>
            </Box>

            <Box className="grid grid-cols-[1.6fr_1fr_1fr] gap-4">
                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <CardHeading bg="#E7EDFD" color="#3B6FD0" icon={Info} title="Situation" />
                    <Box className="mt-4 space-y-3">
                        <Box className="grid grid-cols-[88px_1fr] gap-3">
                            <Text className="text-[13px] font-semibold text-[#9CA3AF]">Contexte</Text>
                            <Text className="text-[14px] font-medium leading-6 text-[#3F4654]">
                                {roleplay.detail.context}
                            </Text>
                        </Box>
                        <Box className="grid grid-cols-[88px_1fr] gap-3">
                            <Text className="text-[13px] font-semibold text-[#9CA3AF]">Objectif</Text>
                            <Text className="text-[14px] font-medium leading-6 text-[#3F4654]">
                                {roleplay.description}
                            </Text>
                        </Box>
                    </Box>
                </CardSurface>

                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 text-center shadow-none">
                    <CardHeading bg="#EEF0FF" color="#5140F0" icon={Info} title="Persona" />
                    {roleplay.avatarSrc && (
                        <img
                            alt={roleplay.name}
                            className="mx-auto mt-4 h-[72px] w-[72px] rounded-full border-2 border-[#E7EAFF] object-cover"
                            src={roleplay.avatarSrc}
                        />
                    )}
                    <Box className="mt-2 flex items-center justify-center gap-2">
                        <Text className="text-[15px] font-extrabold text-[#111827]">{roleplay.name}</Text>
                        <Box className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-1.5 text-[10px] font-bold text-[#5140F0]">
                            AI
                        </Box>
                    </Box>
                    <Text className="text-[13px] font-semibold text-[#6B7280]">
                        {roleplay.role}
                        <br />@ {roleplay.company}
                    </Text>
                    <Box className="mt-2 flex items-center justify-center gap-2">
                        <Box
                            className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold uppercase"
                            style={{ backgroundColor: discStyle.bg, color: discStyle.text }}
                        >
                            {roleplay.disc}
                        </Box>
                        <Box
                            className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold"
                            style={{ backgroundColor: difficultyStyle.bg, color: difficultyStyle.text }}
                        >
                            {roleplay.difficulty}
                        </Box>
                    </Box>
                </CardSurface>

                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 text-center shadow-none">
                    <CardHeading bg="#E7F9ED" color="#16A34A" icon={CheckCircle2} title="Score" />
                    <Box className="mt-3 flex justify-center">
                        <Ring score={session.score} />
                    </Box>
                    <Box className="mt-2 flex items-center justify-center">
                        <Box
                            className="inline-flex h-6 items-center rounded-md px-2.5 text-[12px] font-bold"
                            style={{ backgroundColor: niveau.bg, color: niveau.text }}
                        >
                            {niveau.label}
                        </Box>
                    </Box>
                </CardSurface>
            </Box>

            <ScoreDetail evaluation={evaluation} />

            <Box className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#F7F8FB] px-5 py-4">
                <Text className="text-[14px] font-semibold text-[#3F4654]">
                    L&apos;Analyse méthodologique est basée sur la méthode{" "}
                    <Text as="span" className="font-extrabold text-[#111827]">
                        {roleplay.detail.method.split(" - ")[0]}
                    </Text>
                </Text>
            </Box>
        </Box>
    );
}

function ScoreDetail({ evaluation }: { evaluation: Evaluation }) {
    const scoreDetails = buildEvaluationScoreDetails(evaluation);

    return (
        <Box className="pdf-avoid rounded-[16px] border border-[#E9E7FB] bg-[#FBFBFF] p-5">
            <Box className="flex items-center justify-between gap-3">
                <Text as="h3" className="text-[15px] font-extrabold text-[#111827]">
                    Détail du score global
                </Text>
                <Text className="text-[18px] font-extrabold text-[#5140F0]">
                    {scoreDetails.total}
                    <Text as="span" className="text-[13px] font-bold text-[#9CA3AF]">
                        /100
                    </Text>
                </Text>
            </Box>
            <Box className="mt-4 grid grid-cols-2 gap-3">
                {scoreDetails.rows.map((row) => {
                    const step = evaluation.steps.find((item) => item.number === row.stepNumber);
                    const icon = stepIcons[step?.icon ?? "phone"];

                    return (
                        <Box key={`${row.stepNumber}-${row.title}`} className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                            <Box className="flex items-center gap-2.5">
                                <Box
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: icon.bg, color: icon.color }}
                                >
                                    <InlineIcon icon={icon.icon} className="h-4 w-4" />
                                </Box>
                                <Text className="text-[14px] font-bold leading-5 text-[#111827]">{row.title}</Text>
                            </Box>
                            <Box className="mt-3 grid grid-cols-3 gap-2 text-center">
                                <Box>
                                    <Text className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Poids
                                    </Text>
                                    <Text className="mt-0.5 text-[14px] font-extrabold text-[#111827]">{row.poids}%</Text>
                                </Box>
                                <Box>
                                    <Text className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Score
                                    </Text>
                                    <Text className="mt-0.5 text-[14px] font-extrabold text-[#111827]">{row.score}%</Text>
                                </Box>
                                <Box>
                                    <Text className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Contrib.
                                    </Text>
                                    <Text className="mt-0.5 text-[14px] font-extrabold" style={{ color: icon.color }}>
                                        {row.contribution.toFixed(1)}
                                    </Text>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <Text className="mt-3 text-[12px] font-medium leading-5 text-[#6B7280]">
                {scoreDetails.hasSourceDetails
                    ? "Somme pondérée issue de la notation de session."
                    : "Somme pondérée calculée avec les poids de fallback par étape."}
            </Text>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/* Onglet 1 — Synthèse globale                                         */
/* ------------------------------------------------------------------ */

function SyntheseSection({ evaluation }: { evaluation: Evaluation }) {
    const plans = evaluation.planEtapes ?? [evaluation.planEtape];

    return (
        <PrintSection breakBefore icon={Sparkles} title="Synthèse globale" tone={{ bg: "#EEF0FF", color: "#5140F0" }}>
            <CardSurface className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <CardHeading bg="#E7EDFD" color="#3B6FD0" icon={MessageSquare} title="Avis et ressenti du persona IA" />
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">{evaluation.personaAvis}</Text>
            </CardSurface>

            <CardSurface className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <CardHeading bg="#F3E8FD" color="#8B2FD6" icon={Phone} title="Appréciation globale par le coach IA" />
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                    {evaluation.coachAppreciation}
                </Text>
            </CardSurface>

            <Box className="grid grid-cols-2 gap-5">
                <CardSurface className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <CardHeading bg="#E7F9ED" color="#16A34A" icon={CheckCircle2} title="Points positifs" />
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#6B7280]">
                        Réussites observées
                    </Text>
                    <BulletList items={evaluation.pointsPositifs} tone="green" />
                </CardSurface>

                <CardSurface className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <CardHeading bg="#FEECEF" color="#E11D48" icon={Info} title="Axes d'amélioration" />
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Axes d&apos;amélioration
                    </Text>
                    <BulletList items={evaluation.axesAmelioration} tone="red" />
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Priorité stratégique
                    </Text>
                    <Text className="mt-2 text-[14px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.prioriteStrategique}
                    </Text>
                </CardSurface>
            </Box>

            <CardSurface className="pdf-avoid rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <CardHeading bg="#EEF0FF" color="#5140F0" icon={Sparkles} title="Plan de progrès" />
                <Box className="mt-4 space-y-4">
                    {plans.map((plan) => (
                        <Box key={`${plan.number}-${plan.title}`} className="space-y-3">
                            <Box className="inline-flex min-h-7 items-center rounded-lg bg-[#EEF0FF] px-3 py-1 text-[12px] font-bold text-[#5140F0]">
                                Étape {plan.number} • {plan.title}
                            </Box>
                            <Box className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{plan.text}</Text>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </CardSurface>
        </PrintSection>
    );
}

/* ------------------------------------------------------------------ */
/* Onglet 2 — Analyse méthodologique                                   */
/* ------------------------------------------------------------------ */

function MethodologieSection({ evaluation, personaName }: { evaluation: Evaluation; personaName: string }) {
    return (
        <PrintSection
            breakBefore
            icon={ShieldCheck}
            title="Analyse méthodologique"
            tone={{ bg: "#E7F9ED", color: "#16A34A" }}
        >
            {evaluation.steps.map((step) => (
                <MethodologieStep key={step.number} step={step} personaName={personaName} />
            ))}
        </PrintSection>
    );
}

function MethodologieStep({ step, personaName }: { step: EvaluationStep; personaName: string }) {
    const iconConfig = stepIcons[step.icon];
    const status = stepStatusStyles[step.status];
    const reussis = step.criteresReussis ?? [];
    const ameliorer = step.criteresAAmeliorer ?? [];
    const transcript = step.stepTranscript;
    const reformulations = step.reformulations ?? [];

    return (
        <CardSurface className="pdf-avoid overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none">
            <Box className="flex items-center justify-between gap-4 border-b border-[#ECEEF3] px-5 py-4">
                <Box className="flex items-center gap-4">
                    <Box
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: iconConfig.bg, color: iconConfig.color }}
                    >
                        <InlineIcon icon={iconConfig.icon} className="h-5 w-5" />
                    </Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Étape {step.number} : {step.title}
                    </Text>
                </Box>
                <Box className="flex items-center gap-4">
                    <Ring score={step.score} size={60} stroke={7} />
                    <Box
                        className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold"
                        style={{ backgroundColor: status.bg, color: status.text }}
                    >
                        {step.status}
                    </Box>
                </Box>
            </Box>

            <Box className="space-y-4 px-5 py-5">
                {step.commentaireCoach && (
                    <Box className={cn("rounded-[14px] border p-5", uiTokens.stepBlock.tone.blue.surface)}>
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={MessageSquare} className={cn("h-4 w-4", uiTokens.stepBlock.tone.blue.accent)} />
                            <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                Commentaire du coach
                            </Text>
                        </Box>
                        <Text className="mt-2 text-[14px] font-medium leading-6 text-[#4B5563]">
                            {step.commentaireCoach}
                        </Text>
                    </Box>
                )}

                {(reussis.length > 0 || ameliorer.length > 0) && (
                    <Box className="grid grid-cols-2 gap-4">
                        {reussis.length > 0 && (
                            <Box className={cn("rounded-[14px] border p-5", uiTokens.stepBlock.tone.green.surface)}>
                                <Box className="flex items-center gap-2">
                                    <InlineIcon
                                        icon={CheckCircle2}
                                        className={cn("h-4 w-4", uiTokens.stepBlock.tone.green.accent)}
                                    />
                                    <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                        Critères réussis
                                    </Text>
                                </Box>
                                <Box className="mt-2 space-y-1.5">
                                    {reussis.map((item) => (
                                        <Text key={item} className="text-[14px] font-medium leading-6 text-[#374151]">
                                            {item}
                                        </Text>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {ameliorer.length > 0 && (
                            <Box className={cn("rounded-[14px] border p-5", uiTokens.stepBlock.tone.orange.surface)}>
                                <Box className="flex items-center gap-2">
                                    <InlineIcon
                                        icon={CircleAlert}
                                        className={cn("h-4 w-4", uiTokens.stepBlock.tone.orange.accent)}
                                    />
                                    <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                        Critères à améliorer
                                    </Text>
                                </Box>
                                <Box className="mt-2 space-y-1.5">
                                    {ameliorer.map((item) => (
                                        <Text key={item} className="text-[14px] font-medium leading-6 text-[#374151]">
                                            {item}
                                        </Text>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                <StepCriteriaGrid step={step} />

                {transcript && transcript.lines.length > 0 && (
                    <Box className="rounded-[14px] border border-[#E5E7EB] p-5">
                        <Box className="flex items-center justify-between gap-3">
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={FileText} className="h-4 w-4 text-[#6B7280]" />
                                <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                    Transcript de l&apos;étape
                                </Text>
                            </Box>
                            <Text className="shrink-0 text-[12px] font-semibold text-[#9CA3AF]">
                                {transcript.start} - {transcript.end}
                            </Text>
                        </Box>
                        <Box className="mt-3 space-y-2.5">
                            {transcript.lines.map((line, index) => (
                                <Text key={index} className="text-[14px] leading-6 text-[#374151]">
                                    <Text
                                        as="span"
                                        className="font-bold"
                                        style={{ color: line.speaker === "persona" ? "#8B2FD6" : "#5140F0" }}
                                    >
                                        {line.speaker === "persona" ? personaName : "Moi"} :
                                    </Text>{" "}
                                    {line.text}
                                </Text>
                            ))}
                        </Box>
                    </Box>
                )}

                {reformulations.length > 0 && (
                    <Box className="rounded-[14px] border border-[#E5E7EB] p-5">
                        <Box className="flex items-center gap-2">
                            <InlineIcon icon={Sparkles} className="h-4 w-4 text-[#5140F0]" />
                            <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                Suggestions de reformulation
                            </Text>
                        </Box>
                        <Box className="mt-3 space-y-5">
                            {reformulations.map((reformulation, index) => (
                                <Box key={index} className="space-y-2">
                                    <Box>
                                        <Text as="span" className="text-[12px] font-bold text-[#EA580C]">
                                            Original
                                        </Text>
                                        <Text className="text-[14px] italic leading-6 text-[#6B7280]">
                                            « {reformulation.original} »
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text as="span" className="text-[12px] font-bold text-[#16A34A]">
                                            Suggestion prioritaire
                                        </Text>
                                        <Text className="text-[14px] italic leading-6 text-[#1F7A3D]">
                                            « {reformulation.suggestion} »
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text as="span" className="text-[12px] font-bold text-[#8B2FD6]">
                                            Pourquoi
                                        </Text>
                                        <Text className="text-[14px] leading-6 text-[#4B5563]">
                                            {reformulation.pourquoi}
                                        </Text>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </CardSurface>
    );
}

/** Grille d'analyse détaillée d'une étape (contenu de la dialog « Voir l'analyse détaillée »), en cartes pour l'A4. */
function StepCriteriaGrid({ step }: { step: EvaluationStep }) {
    if (step.criteria.length === 0) {
        return null;
    }

    return (
        <Box className="rounded-[14px] border border-[#E5E7EB] p-5">
            <Box className="flex items-center justify-between gap-3">
                <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                    Grille d&apos;analyse détaillée
                </Text>
                <Text className="text-[13px] font-bold" style={{ color: scoreColor(step.score) }}>
                    Total {step.total} • {step.score}%
                </Text>
            </Box>
            <Box className="mt-4 space-y-3">
                {step.criteria.map((criterion) => (
                    <Box key={criterion.critere} className="rounded-[12px] border border-[#ECEEF3] bg-[#FBFBFD] p-4">
                        <Box className="flex items-start justify-between gap-3">
                            <Box>
                                <Text className="text-[14px] font-bold leading-5 text-[#111827]">{criterion.critere}</Text>
                                {criterion.competence && (
                                    <Text className="mt-0.5 text-[12px] font-semibold text-[#9CA3AF]">
                                        {criterion.competence}
                                    </Text>
                                )}
                            </Box>
                            <Box className="inline-flex shrink-0 items-center rounded-md bg-[#FEF3C7] px-2 py-1 text-[12px] font-bold text-[#B45309]">
                                {criterion.points}
                            </Box>
                        </Box>

                        <Box className="mt-3 grid grid-cols-2 gap-3">
                            <CriterionField label="Preuves attendues" value={criterion.preuvesAttendues} />
                            <CriterionField label="Analyse" value={criterion.analyse} />
                        </Box>

                        {criterion.preuvesObservees.length > 0 && (
                            <Box className="mt-3">
                                <Text className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                    Preuves observées
                                </Text>
                                <Box className="mt-1.5 space-y-2">
                                    {criterion.preuvesObservees.map((proof, proofIndex) => (
                                        <Box key={proofIndex}>
                                            <Text className="text-[13px] font-medium italic leading-6 text-[#374151]">
                                                « {proof.quote} »
                                            </Text>
                                            <Text className="text-[11px] font-medium text-[#9CA3AF]">
                                                {proof.speaker} · {proof.time}
                                            </Text>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Box className="mt-3 space-y-2">
                            <CriterionField accent="#5140F0" label="Conseils d'amélioration" value={criterion.conseils} />
                        </Box>
                        <Box className="mt-3 rounded-lg bg-[#E7F9ED] px-3 py-2">
                            <Text className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#15803D]">
                                Verbatim préconisé
                            </Text>
                            <Text className="mt-1 text-[13px] font-medium italic leading-6 text-[#1F7A3D]">
                                « {criterion.verbatim} »
                            </Text>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function CriterionField({ accent, label, value }: { accent?: string; label: string; value: string }) {
    return (
        <Box>
            <Text className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#9CA3AF]">{label}</Text>
            <Text
                className="mt-1 text-[13px] font-medium leading-6"
                style={{ color: accent ?? "#4B5563" }}
            >
                {value}
            </Text>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/* Onglet 3 — Analyse discours                                         */
/* ------------------------------------------------------------------ */

function DiscoursSection({ evaluation }: { evaluation: Evaluation }) {
    return (
        <PrintSection breakBefore icon={Info} title="Analyse discours" tone={{ bg: "#E7EDFD", color: "#3B6FD0" }}>
            <Box className="grid grid-cols-3 gap-4">
                {evaluation.discourse.map((metric) => (
                    <CardSurface
                        key={metric.title}
                        className="pdf-avoid flex min-h-[150px] flex-col rounded-[14px] border border-[#E5E7EB] p-5 shadow-none"
                    >
                        <Box className="flex items-center gap-1.5">
                            <Text className="text-[14px] font-semibold text-[#4B5563]">{metric.title}</Text>
                        </Box>
                        <Text className="mt-3 text-[30px] font-extrabold leading-none text-[#111827]">
                            {metric.value}
                        </Text>
                        {metric.subtitle && (
                            <Box className="mt-auto flex items-center gap-2 pt-4">
                                {metric.reco && (
                                    <Box
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: metric.reco === "ok" ? "#22C55E" : "#EF4444" }}
                                    />
                                )}
                                <Text className="text-[13px] font-medium text-[#6B7280]">{metric.subtitle}</Text>
                            </Box>
                        )}
                    </CardSurface>
                ))}
            </Box>
        </PrintSection>
    );
}

/* ------------------------------------------------------------------ */
/* Onglet 4 — Transcription                                            */
/* ------------------------------------------------------------------ */

function TranscriptionSection({ evaluation, personaName }: { evaluation: Evaluation; personaName: string }) {
    return (
        <PrintSection breakBefore icon={FileText} title="Transcription" tone={{ bg: "#F3E8FD", color: "#8B2FD6" }}>
            <CardSurface className="space-y-5 rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                {evaluation.transcript.length === 0 ? (
                    <Text className="py-6 text-center text-[14px] font-semibold text-[#9CA3AF]">
                        Aucune transcription disponible.
                    </Text>
                ) : (
                    evaluation.transcript.map((message, index) => {
                        const isPersona = message.speaker === "persona";
                        return (
                            <Box
                                key={index}
                                className={cn("pdf-avoid flex gap-3", isPersona ? "flex-row-reverse" : "flex-row")}
                            >
                                <Box
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                        isPersona ? "bg-[#5140F0] text-white" : "bg-[#EEF0F5] text-[#6B7280]",
                                    )}
                                >
                                    {isPersona ? "AI" : "Moi"}
                                </Box>
                                <Box className={cn("max-w-[78%]", isPersona ? "text-right" : "text-left")}>
                                    <Box
                                        className={cn(
                                            "flex items-center gap-2 text-[12px] font-semibold text-[#9CA3AF]",
                                            isPersona ? "justify-end" : "justify-start",
                                        )}
                                    >
                                        <Text as="span">{isPersona ? personaName : "Moi"}</Text>
                                        <Text as="span">{message.time}</Text>
                                    </Box>
                                    <Box
                                        className={cn(
                                            "mt-1.5 inline-block rounded-2xl px-4 py-2.5 text-[14px] font-medium leading-6 text-[#1F2433]",
                                            isPersona ? "bg-[#EEF0FF]" : "bg-[#F3F4F6]",
                                        )}
                                    >
                                        {message.text}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </CardSurface>
        </PrintSection>
    );
}

/* ------------------------------------------------------------------ */
/* Page d'impression                                                   */
/* ------------------------------------------------------------------ */

export function RoleplaySessionEvaluationPrintPage({
    evaluation,
    roleplay,
    session,
}: RoleplaySessionEvaluationPrintPageProps) {
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
            <Box className="pdf-sheet mx-auto max-w-[900px] space-y-6 rounded-[28px] bg-white p-8 shadow-[0_24px_70px_rgba(17,24,39,0.10)]">
                <ReportHeader evaluation={evaluation} roleplay={roleplay} session={session} />
                <SyntheseSection evaluation={evaluation} />
                <MethodologieSection evaluation={evaluation} personaName={roleplay.name} />
                <DiscoursSection evaluation={evaluation} />
                <TranscriptionSection evaluation={evaluation} personaName={roleplay.name} />
            </Box>
        </Box>
    );
}
