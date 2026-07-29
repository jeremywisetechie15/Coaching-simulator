import {
    CalendarDays,
    CheckCircle2,
    Clock,
    Sparkles,
    Target,
    Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { MethodDetail } from "@/features/methods/domain/method";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type {
    Evaluation,
    EvaluationKeyMoment,
    TranscriptCorrection,
} from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import {
    buildEvaluationScoreDetails,
    buildTranscriptHighlightSegments,
    ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE,
    scoreLevel,
} from "@/features/roleplays/domain";

interface RoleplaySessionReportPrintPageProps {
    evaluation: Evaluation;
    method: RoleplaySessionReportMethod | null;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export interface RoleplaySessionReportMethod {
    challenges: MethodDetail["challenges"];
    description: MethodDetail["description"];
    name: MethodDetail["name"];
    objectives: MethodDetail["objectives"];
    steps: Array<Pick<
        MethodDetail["steps"][number],
        "id" | "shortTitle" | "summary" | "takeaway" | "title"
    >>;
}

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

function Section({
    avoidBreak = true,
    children,
    className,
    eyebrow,
    title,
}: {
    avoidBreak?: boolean;
    children: ReactNode;
    className?: string;
    eyebrow?: string;
    title: string;
}) {
    return (
        <CardSurface
            className={cn(
                avoidBreak && "pdf-avoid",
                "rounded-[18px] border border-[#E9E7FB] p-6 shadow-none",
                className,
            )}
        >
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
    const level = scoreLevel(session.score, roleplay.validationThreshold);

    return (
        <Box className="rounded-[24px] bg-[#111827] px-8 py-7 text-white">
            <Box className="flex items-start justify-between gap-6">
                <Box className="min-w-0 flex-1">
                    <Text className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#B9B2F8]">
                        Rapport d&apos;évaluation
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
                    <Text className="text-[14px] font-extrabold text-[#DC2626]">Axes d&apos;amélioration</Text>
                    <Box className="mt-3">
                        <BulletList items={evaluation.axesAmelioration} tone="red" />
                    </Box>
                </Box>
            </Box>
        </Section>
    );
}

function KeyMoment({ moment }: { moment: EvaluationKeyMoment }) {
    const t = uiTokens.evaluationKeyMoments;

    return (
        <Box className={cn("pdf-avoid", t.card)}>
            <Box className={t.header}>
                <Box className={t.headerIdentity}>
                    <Text as="span" className={t.number}>
                        Moment clé n°{moment.number}
                    </Text>
                    <Text as="span" className={t.title}>
                        {moment.title}
                    </Text>
                </Box>
                <Box className={t.headerMeta}>
                    <Text as="span" className={cn(t.impact, t.impactTone[moment.impactType])}>
                        {moment.impact}
                    </Text>
                    {moment.time && (
                        <Text as="span" className={t.time}>
                            <InlineIcon icon={Clock} className="h-3.5 w-3.5" />
                            {moment.time}
                        </Text>
                    )}
                </Box>
            </Box>

            <Text className={t.step}>{moment.stepLabel}</Text>

            <Box className={t.detail}>
                <Box>
                    <Text className={t.detailLabel}>Extrait du transcript</Text>
                    {moment.transcript.length === 0 ? (
                        <Text className={t.detailText}>Aucun extrait disponible.</Text>
                    ) : (
                        moment.transcript.map((excerpt, index) => (
                            <Box key={`${excerpt.time}-${excerpt.speaker}-${index}`} className={t.transcript}>
                                <Text as="span" className={t.speaker}>
                                    {excerpt.speaker} :
                                </Text>
                                <Text className={t.transcriptText}>« {excerpt.text} »</Text>
                            </Box>
                        ))
                    )}
                </Box>

                <Box>
                    <Text className={t.detailLabel}>Pourquoi c&apos;est un moment clé</Text>
                    <Text className={t.detailText}>{moment.reason}</Text>
                </Box>

                <Box>
                    <Text className={t.detailLabel}>Perception probable du client</Text>
                    <Text className={t.detailText}>{moment.clientPerception}</Text>
                </Box>

                <Box className={t.recommendation}>
                    <Text className={t.recommendationLabel}>
                        <InlineIcon icon={CheckCircle2} className="h-4 w-4 shrink-0" />
                        Réponse alternative recommandée
                    </Text>
                    <Text className={t.recommendationText}>« {moment.recommendedResponse} »</Text>
                </Box>
            </Box>
        </Box>
    );
}

function KeyMoments({ evaluation }: { evaluation: Evaluation }) {
    const countLabel = evaluation.momentsCles.length > 1 ? "moments détectés" : "moment détecté";

    return (
        <Section
            avoidBreak={false}
            className="pdf-break"
            eyebrow="Analyse de l'échange"
            title="Moments clés de l'échange"
        >
            {evaluation.momentsCles.length === 0 ? (
                <Text className="text-[13px] font-medium text-[#9CA3AF]">Aucun moment clé détecté.</Text>
            ) : (
                <>
                    <Box className="mb-4 flex items-center gap-2 text-[#B45309]">
                        <InlineIcon icon={Zap} className="h-4 w-4" />
                        <Text className="text-[12px] font-bold">
                            {evaluation.momentsCles.length} {countLabel}
                        </Text>
                    </Box>
                    <Box className="space-y-4">
                        {evaluation.momentsCles.map((moment) => (
                            <KeyMoment key={moment.id} moment={moment} />
                        ))}
                    </Box>
                </>
            )}
        </Section>
    );
}

function PlanProgress({ evaluation }: { evaluation: Evaluation }) {
    const plans = evaluation.planEtapes ?? [evaluation.planEtape];

    return (
        <Section eyebrow="Plan" title={ROLEPLAY_PROGRESS_PLAN_SECTION_TITLE}>
            <Box className="space-y-4">
                {plans.map((plan) => (
                    <Box key={`${plan.number}-${plan.title}`} className="rounded-[14px] border border-[#E9E7FB] bg-[#F8F7FF] p-4">
                        <Text className="text-[12px] font-extrabold text-[#5140F0]">
                            Étape {plan.number} • {plan.title}
                        </Text>
                        <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">{plan.text}</Text>
                    </Box>
                ))}
                <Box className="rounded-[14px] border border-[#E9E7FB] bg-[#F8F7FF] p-4">
                    <Text className={uiTokens.roleplayEvaluation.strategicPriorityTitle}>
                        Priorité stratégique
                    </Text>
                    <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.prioriteStrategique}
                    </Text>
                </Box>
            </Box>
        </Section>
    );
}

function MethodologySummary({ method }: { method: RoleplaySessionReportMethod | null }) {
    return (
        <Section
            avoidBreak={false}
            className="pdf-break"
            eyebrow="Méthodologie"
            title="Analyse méthodologique"
        >
            {!method ? (
                <Text className="text-[13px] font-medium text-[#9CA3AF]">
                    Aucune méthode associée à ce roleplay.
                </Text>
            ) : (
                <Box className="space-y-5">
                    <Box className="pdf-avoid rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-5">
                        <Text className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#5140F0]">
                            Descriptif de la méthode
                        </Text>
                        <Text as="h3" className="mt-2 text-[17px] font-extrabold text-[#111827]">
                            {method.name}
                        </Text>
                        <Text className="mt-2 text-[13px] font-medium leading-6 text-[#4B5563]">
                            {method.description || "Aucun descriptif renseigné."}
                        </Text>
                    </Box>

                    <Box>
                        <Text as="h3" className="text-[15px] font-extrabold text-[#111827]">
                            À retenir en 30 secondes
                        </Text>
                        {method.steps.length === 0 ? (
                            <Text className="mt-3 text-[13px] font-medium text-[#9CA3AF]">
                                Aucun point clé renseigné.
                            </Text>
                        ) : (
                            <Box className="mt-3 grid gap-3 md:grid-cols-2">
                                {method.steps.map((step, index) => (
                                    <Box
                                        key={step.id}
                                        className="pdf-avoid flex gap-3 rounded-[12px] border border-[#E9E7FB] bg-[#FAF9FF] p-4"
                                    >
                                        <Text
                                            as="span"
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5140F0] text-[12px] font-extrabold text-white"
                                        >
                                            {index + 1}
                                        </Text>
                                        <Box>
                                            <Text className="text-[13px] font-extrabold text-[#111827]">
                                                {step.shortTitle || step.title}
                                            </Text>
                                            <Text className="mt-1 text-[12px] font-medium leading-5 text-[#6B7280]">
                                                {step.takeaway || step.summary || "Étape pédagogique"}
                                            </Text>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Box className="grid gap-4 md:grid-cols-2">
                        <Box className="pdf-avoid rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-5">
                            <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                Objectifs
                            </Text>
                            <Box className="mt-3">
                                <BulletList items={method.objectives} tone="violet" />
                            </Box>
                        </Box>
                        <Box className="pdf-avoid rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-5">
                            <Text as="h3" className="text-[14px] font-extrabold text-[#111827]">
                                Enjeux
                            </Text>
                            <Box className="mt-3">
                                <BulletList items={method.challenges} tone="violet" />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}
        </Section>
    );
}

function PrintTranscriptMessageText({
    corrections,
    text,
}: {
    corrections: readonly TranscriptCorrection[];
    text: string;
}) {
    const segments = buildTranscriptHighlightSegments(
        text,
        corrections.map((correction) => correction.original),
    );

    return segments.map((segment, index) => (
        segment.highlighted ? (
            <mark
                key={`${index}-${segment.text}`}
                className={cn(
                    "rounded-sm px-0.5 text-inherit",
                    uiTokens.roleplayEvaluation.transcriptCorrection.highlight,
                )}
            >
                {segment.text}
            </mark>
        ) : (
            <span key={`${index}-${segment.text}`}>{segment.text}</span>
        )
    ));
}

function PrintTranscriptCorrectionPanel({
    corrections,
}: {
    corrections: readonly TranscriptCorrection[];
}) {
    const t = uiTokens.roleplayEvaluation.transcriptCorrection;

    if (corrections.length === 0) return null;

    return (
        <Box className={cn("mt-3 rounded-[10px] border border-l-[3px] px-4 py-3.5", t.panel)}>
            <Box className="flex items-center gap-2">
                <InlineIcon icon={Sparkles} className={cn("h-4 w-4", t.titleIcon)} />
                <Text className={cn("text-[13px] font-extrabold", t.title)}>Correction IA</Text>
            </Box>

            <Box className="mt-3 space-y-4">
                {corrections.map((correction, index) => (
                    <Box
                        key={`${correction.criterionRef}-${index}`}
                        className={index > 0 ? cn("border-t pt-4", t.divider) : undefined}
                    >
                        <Text className={cn("text-[11px] font-extrabold uppercase", t.suggestionLabel)}>
                            Verbatim préconisé
                        </Text>
                        <Text className={cn("mt-1 text-[13px] font-semibold leading-6", t.suggestionText)}>
                            « {correction.suggestion} »
                        </Text>
                        <Text className={cn("mt-3 text-[11px] font-extrabold uppercase", t.reasonLabel)}>
                            Pourquoi
                        </Text>
                        <Text className={cn("mt-1 text-[12px] leading-5", t.reasonText)}>
                            {correction.reason}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function Transcript({ evaluation, roleplay }: { evaluation: Evaluation; roleplay: RoleplayItem }) {
    return (
        <Section avoidBreak={false} className="pdf-break" eyebrow="Session" title="Transcription">
            <Box className="space-y-3">
                {evaluation.transcript.length === 0 ? (
                    <Text className="text-[13px] font-medium text-[#9CA3AF]">Aucune transcription disponible.</Text>
                ) : (
                    evaluation.transcript.map((message, index) => {
                        const isPersona = message.speaker === "persona";
                        const corrections = isPersona ? [] : (message.corrections ?? []);

                        return (
                            <Box
                                key={`${message.time}-${index}`}
                                className="pdf-avoid rounded-[12px] bg-[#F7F8FB] px-4 py-3"
                            >
                                <Box className="flex items-center justify-between gap-3">
                                    <Text className="text-[12px] font-extrabold text-[#111827]">
                                        {isPersona ? roleplay.name : "Apprenant"}
                                    </Text>
                                    <Text className="text-[11px] font-bold text-[#9CA3AF]">{message.time}</Text>
                                </Box>
                                <Text className="mt-1 text-[13px] font-medium leading-6 text-[#4B5563]">
                                    <PrintTranscriptMessageText corrections={corrections} text={message.text} />
                                </Text>
                                <PrintTranscriptCorrectionPanel corrections={corrections} />
                            </Box>
                        );
                    })
                )}
            </Box>
        </Section>
    );
}

export function RoleplaySessionReportPrintPage({
    evaluation,
    method,
    roleplay,
    session,
}: RoleplaySessionReportPrintPageProps) {
    return (
        <Box className="min-h-screen bg-[#F3F4F8] px-6 py-8 text-[#111827] print:bg-white print:p-0">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @page { size: A4; margin: 12mm 12mm 16mm; }
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
                <KeyMoments evaluation={evaluation} />
                <PlanProgress evaluation={evaluation} />
                <MethodologySummary method={method} />
                <Transcript evaluation={evaluation} roleplay={roleplay} />
            </Box>
        </Box>
    );
}
