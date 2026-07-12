"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Clock,
    Download,
    Eye,
    FileText,
    Hash,
    Info,
    Layers,
    MessageSquare,
    MoreVertical,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import { METHOD_ROUTES } from "@/features/methods/domain/method";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton } from "@/lib/ui/molecules";
import { AnalysisLoaderDialog, Drawer, Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    categoryBadgeStyles,
    discBadgeStyles,
    difficultyBadgeStyles,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import {
    evaluation as fallbackEvaluation,
    stepStatusStyles,
} from "@/features/roleplays/data/evaluation";
import type { Evaluation, EvaluationCriterion, EvaluationStep } from "@/features/roleplays/data/evaluation";
import {
    buildEvaluationScoreDetails,
    ROLEPLAY_PDF_TEMPLATES,
    ROLEPLAY_ROUTES,
    scoreLevel,
    type RoleplayPdfTemplate,
} from "@/features/roleplays/domain";
import { ROLEPLAY_ANALYSIS_STEPS, ROLEPLAY_PDF_EXPORT_STEPS } from "@/features/roleplays/data/session-analysis";
import { SimulationView } from "./SimulationView";
import { EvaluationKeyMomentsSection } from "./EvaluationKeyMomentsSection";

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

function Ring({ score, size = 110, stroke = 11 }: { score: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = scoreColor(score);
    const valueClassName = size <= 72 ? "text-[17px]" : "text-[22px]";

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
                <Text className={cn(valueClassName, "font-extrabold")} style={{ color }}>
                    {score}%
                </Text>
            </Box>
        </Box>
    );
}

const TABS = ["Synthèse globale", "Analyse méthodologique", "Transcription"] as const;
type TabName = (typeof TABS)[number];

interface EvaluationPageContentProps {
    evaluation?: Evaluation;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export function EvaluationPageContent({ evaluation, roleplay, session }: EvaluationPageContentProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabName>("Synthèse globale");
    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const [notationRefreshStep, setNotationRefreshStep] = useState<number | null>(null);
    const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
    const [openStep, setOpenStep] = useState<EvaluationStep | null>(null);
    const [transcriptQuery, setTranscriptQuery] = useState("");
    const [simView, setSimView] = useState<"persona" | "coach" | null>(null);
    const [pdfExportStep, setPdfExportStep] = useState<number | null>(null);
    const evaluationData = evaluation ?? fallbackEvaluation;

    const categoryStyle = categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const discStyle = discBadgeStyles[roleplay.disc];
    const notationRefreshing = notationRefreshStep !== null;
    const pdfExporting = pdfExportStep !== null;

    const filteredTranscript = useMemo(() => {
        const q = transcriptQuery.trim().toLowerCase();
        if (!q) {
            return evaluationData.transcript;
        }
        return evaluationData.transcript.filter((message) => message.text.toLowerCase().includes(q));
    }, [evaluationData.transcript, transcriptQuery]);

    useEffect(() => {
        if (notationRefreshStep === null) return;
        if (notationRefreshStep >= ROLEPLAY_ANALYSIS_STEPS.length - 1) return;

        const stepTimer = setTimeout(() => setNotationRefreshStep((step) => (step === null ? step : step + 1)), 700);
        return () => clearTimeout(stepTimer);
    }, [notationRefreshStep]);

    useEffect(() => {
        if (pdfExportStep === null) return;
        if (pdfExportStep >= ROLEPLAY_PDF_EXPORT_STEPS.length - 1) return;

        const stepTimer = setTimeout(() => setPdfExportStep((step) => (step === null ? step : step + 1)), 600);
        return () => clearTimeout(stepTimer);
    }, [pdfExportStep]);

    const notationRefreshSteps = ROLEPLAY_ANALYSIS_STEPS.map((label, index) => ({
        label,
        status:
            notationRefreshStep === null || index > notationRefreshStep
                ? ("pending" as const)
                : index < notationRefreshStep
                  ? ("done" as const)
                  : ("active" as const),
    }));

    const pdfExportSteps = ROLEPLAY_PDF_EXPORT_STEPS.map((label, index) => ({
        label,
        status:
            pdfExportStep === null || index > pdfExportStep
                ? ("pending" as const)
                : index < pdfExportStep
                  ? ("done" as const)
                  : ("active" as const),
    }));

    const refreshNotation = async () => {
        if (notationRefreshing) return;

        setNotationRefreshStep(0);
        setActionMenuOpen(false);

        try {
            const response = await fetch("/api/notation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: session.id }),
            });
            const payload: unknown = await response.json().catch(() => null);

            if (payload && typeof payload === "object" && "skipped" in payload && payload.skipped === true) {
                throw new Error("Cette session ne peut pas être notée.");
            }

            if (!response.ok) {
                const errorMessage =
                    payload && typeof payload === "object" && "error" in payload
                        ? String(payload.error)
                        : "Impossible de relancer la notation de cette session.";
                throw new Error(errorMessage);
            }

            setNotationRefreshStep(null);
            router.refresh();
        } catch (error) {
            setNotationRefreshStep(null);
            window.alert(error instanceof Error ? error.message : "Impossible de relancer la notation de cette session.");
        }
    };

    const exportPdf = async (template: RoleplayPdfTemplate) => {
        if (pdfExporting) return;

        setPdfExportStep(0);

        try {
            const response = await fetch(ROLEPLAY_ROUTES.api.sessionPdfExport(session.id, template));

            if (!response.ok) {
                const payload: unknown = await response.json().catch(() => null);
                const errorMessage =
                    payload && typeof payload === "object" && "error" in payload
                        ? String(payload.error)
                        : "Impossible de générer le PDF de cette session.";
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `maia-coach-${template}-${session.id}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);

            setPdfExportStep(null);
        } catch (error) {
            setPdfExportStep(null);
            window.alert(error instanceof Error ? error.message : "Impossible de générer le PDF de cette session.");
        }
    };

    if (simView) {
        const isPersona = simView === "persona";
        // Embarque le runtime public existant sans le modifier (contrat iframe).
        const iframeSrc = roleplay.scenarioId
            ? isPersona
                ? ROLEPLAY_ROUTES.app.personaFeedback(roleplay.scenarioId, session.id)
                : ROLEPLAY_ROUTES.app.sessionDebrief(roleplay.scenarioId, session.id)
            : null;

        return (
            <SimulationView
                backLabel="Retour à l'évaluation de la session"
                title={
                    isPersona
                        ? `${roleplay.name} — Avis et ressenti`
                        : `Débrief avec le coach IA — ${roleplay.name}`
                }
                liveTabLabel={isPersona ? "AI Persona" : "AI Coach"}
                iframeSrc={iframeSrc}
                personaName={roleplay.name}
                transcript={evaluationData.transcript}
                onBack={() => setSimView(null)}
                panel={
                    isPersona ? (
                        <PersonaFeedbackPanel evaluation={evaluationData} />
                    ) : (
                        <CoachDebriefPanel evaluation={evaluationData} />
                    )
                }
            />
        );
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-4">
                        <ContextualBackLink
                            fallbackHref={ROLEPLAY_ROUTES.app.history}
                            aria-label="Retour"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Text as="h1" className="text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]">
                            Évaluation de la simulation
                        </Text>
                    </Box>
                    <Box className="flex items-center gap-2">
                        <Button
                            disabled={pdfExporting}
                            onClick={() => exportPdf(ROLEPLAY_PDF_TEMPLATES.report)}
                            className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <InlineIcon icon={Download} className="h-4 w-4" />
                            Exporter PDF
                        </Button>
                        <Box className="relative">
                            <Button
                                aria-expanded={actionMenuOpen}
                                aria-label="Plus d'options"
                                onClick={() => setActionMenuOpen((open) => !open)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE]"
                            >
                                <InlineIcon icon={MoreVertical} className="h-5 w-5" />
                            </Button>
                            {actionMenuOpen && (
                                <CardActionMenu>
                                    <CardActionMenuButton
                                        disabled={notationRefreshing}
                                        icon={RefreshCw}
                                        label={notationRefreshing ? "Relance..." : "Relancer notation"}
                                        onClick={refreshNotation}
                                    />
                                </CardActionMenu>
                            )}
                        </Box>
                    </Box>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-8">
                    <Box className="mb-4 flex items-center justify-end gap-2">
                        <Box className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                        <Text className="text-[14px] font-bold text-[#16A34A]">Données synchronisées</Text>
                    </Box>

                    <Box className="flex flex-col gap-4 rounded-[14px] bg-[#F7F8FB] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <Box className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-[#4B5563]">
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={Hash} className="h-4 w-4 text-[#9CA3AF]" />
                                Session n°{session.attemptNumber}
                            </Box>
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#9CA3AF]" />
                                Réalisé le {session.date} à {session.time}
                            </Box>
                            <Box className="flex items-center gap-2">
                                <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                Durée session: {session.duration}
                            </Box>
                        </Box>
                        <Box
                            className="inline-flex h-9 w-fit items-center rounded-lg px-3.5 text-[13px] font-bold"
                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                        >
                            {roleplay.category}
                        </Box>
                    </Box>

                    <Box className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
                        <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EDFD]">
                                    <InlineIcon icon={Info} className="h-5 w-5 text-[#3B6FD0]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Situation
                                </Text>
                            </Box>
                            <Box className="mt-4 space-y-3">
                                <Box className="grid grid-cols-[88px_1fr] gap-3">
                                    <Text className="text-[13px] font-semibold text-[#9CA3AF]">Contexte</Text>
                                    <Text className="text-[14px] font-medium leading-6 text-[#3F4654]">
                                        {evaluationData.steps.length > 0 ? roleplay.detail.context : ""}
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
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF]">
                                    <InlineIcon icon={Info} className="h-5 w-5 text-[#5140F0]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Persona
                                </Text>
                            </Box>
                            <Box className="mx-auto mt-4 h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-[#E7EAFF]">
                                <Box
                                    aria-label={roleplay.name}
                                    role="img"
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                />
                            </Box>
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
                            <Box className="flex items-center gap-3">
                                <Box className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F9ED]">
                                    <InlineIcon icon={CheckCircle2} className="h-5 w-5 text-[#16A34A]" />
                                </Box>
                                <Text as="h3" className="text-[17px] font-bold text-[#111827]">
                                    Score
                                </Text>
                            </Box>
                            <Box className="mt-3 flex justify-center">
                                <Ring score={session.score} />
                            </Box>
                            <Box className="mt-2 flex items-center justify-center gap-2">
                                <Box
                                    className="inline-flex h-6 items-center rounded-md px-2.5 text-[12px] font-bold"
                                    style={{
                                        backgroundColor: scoreNiveau(session.score).bg,
                                        color: scoreNiveau(session.score).text,
                                    }}
                                >
                                    {scoreNiveau(session.score).label}
                                </Box>
                                <Button
                                    aria-label="Détail du score global"
                                    onClick={() => setScoreInfoOpen(true)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#5140F0]"
                                >
                                    <InlineIcon icon={Info} className="h-4 w-4" />
                                </Button>
                            </Box>
                        </CardSurface>
                    </Box>

                    <Box className="mt-5 flex flex-col gap-3 rounded-[14px] bg-[#F7F8FB] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <Text className="text-[14px] font-semibold text-[#3F4654]">
                            L&apos;Analyse méthodologique est basée sur la méthode{" "}
                            <Text as="span" className="font-extrabold text-[#111827]">
                                {roleplay.detail.method.split(" - ")[0]}
                            </Text>
                        </Text>
                        {roleplay.methodId ? (
                            <ContextualLink
                                href={METHOD_ROUTES.app.detail(roleplay.methodId)}
                                className="flex items-center gap-1.5 text-[14px] font-bold text-[#5140F0]"
                            >
                                Découvrir la méthode
                                <InlineIcon icon={ChevronDown} className="h-4 w-4 -rotate-90" />
                            </ContextualLink>
                        ) : (
                            <Button
                                disabled
                                className="flex items-center gap-1.5 text-[14px] font-bold text-[#9CA3AF]"
                            >
                                Aucune méthode associée
                            </Button>
                        )}
                    </Box>

                    <Box
                        role="tablist"
                        className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-b border-[#ECEEF3]"
                    >
                        {TABS.map((tab) => {
                            const isActive = tab === activeTab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveTab(tab)}
                                    className={`-mb-px border-b-2 pb-3 text-[15px] font-bold transition ${
                                        isActive
                                            ? "border-[#5140F0] text-[#5140F0]"
                                            : "border-transparent text-[#6B7280] hover:text-[#374151]"
                                    }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </Box>

                    <Box className="mt-6">
                        {activeTab === "Synthèse globale" && (
                            <SyntheseTab
                                evaluation={evaluationData}
                                onAskPersona={() => setSimView("persona")}
                                onDebrief={() => setSimView("coach")}
                                stepsHref={`/roleplays/${roleplay.id}/steps?coach=after&sessionId=${encodeURIComponent(session.id)}`}
                            />
                        )}
                        {activeTab === "Analyse méthodologique" && (
                            <MethodologieTab
                                evaluation={evaluationData}
                                personaName={roleplay.name}
                                onOpenDetail={setOpenStep}
                            />
                        )}
                        {activeTab === "Transcription" && (
                            <TranscriptionTab
                                query={transcriptQuery}
                                onQueryChange={setTranscriptQuery}
                                messages={filteredTranscript}
                                personaName={roleplay.name}
                            />
                        )}
                    </Box>
                </CardSurface>
            </Box>

            {openStep && <StepDetailModal step={openStep} onClose={() => setOpenStep(null)} />}

            {scoreInfoOpen && (
                <ScoreInfoDrawer evaluation={evaluationData} onClose={() => setScoreInfoOpen(false)} />
            )}

            {notationRefreshing && (
                <AnalysisLoaderDialog
                    title="Analyse en cours"
                    description="La notation de cette session est recalculée à partir de la transcription et de la grille associée."
                    steps={notationRefreshSteps}
                    onClose={() => setNotationRefreshStep(null)}
                />
            )}

            {pdfExporting && (
                <AnalysisLoaderDialog
                    title="Génération du PDF"
                    description="Votre rapport d'évaluation est en cours de préparation. Le téléchargement démarrera automatiquement."
                    steps={pdfExportSteps}
                    onClose={() => setPdfExportStep(null)}
                />
            )}
        </Box>
    );
}

function SyntheseTab({
    evaluation,
    onAskPersona,
    onDebrief,
    stepsHref,
}: {
    evaluation: Evaluation;
    onAskPersona: () => void;
    onDebrief: () => void;
    stepsHref: string;
}) {
    return (
        <Box className="space-y-5">
            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7EDFD]">
                            <InlineIcon icon={MessageSquare} className="h-[18px] w-[18px] text-[#3B6FD0]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Avis et ressenti du persona IA
                        </Text>
                    </Box>
                    <Button
                        onClick={onAskPersona}
                        className="flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                    >
                        <InlineIcon icon={Video} className="h-4 w-4 text-[#5140F0]" />
                        Ask AI persona
                    </Button>
                </Box>
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                    {evaluation.personaAvis}
                </Text>
            </CardSurface>

            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center gap-3">
                    <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FD]">
                        <InlineIcon icon={Phone} className="h-[18px] w-[18px] text-[#8B2FD6]" />
                    </Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Appréciation globale par le coach IA
                    </Text>
                </Box>
                <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">
                    {evaluation.coachAppreciation}
                </Text>
            </CardSurface>

            <EvaluationKeyMomentsSection moments={evaluation.momentsCles} />

            <Box className="grid gap-5 lg:grid-cols-2">
                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F9ED]">
                            <InlineIcon icon={CheckCircle2} className="h-[18px] w-[18px] text-[#16A34A]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Points positifs
                        </Text>
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#6B7280]">
                        Réussites observées
                    </Text>
                    <Box className="mt-2 space-y-2.5">
                        {evaluation.pointsPositifs.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                </CardSurface>

                <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEECEF]">
                            <InlineIcon icon={Info} className="h-[18px] w-[18px] text-[#E11D48]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Axes d&apos;amélioration
                        </Text>
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Axes d&apos;amélioration
                    </Text>
                    <Box className="mt-2 space-y-2.5">
                        {evaluation.axesAmelioration.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E11D48]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                    <Text as="p" className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#E11D48]">
                        Priorité stratégique
                    </Text>
                    <Text className="mt-2 text-[14px] font-medium leading-6 text-[#4B5563]">
                        {evaluation.prioriteStrategique}
                    </Text>
                </CardSurface>
            </Box>

            <CardSurface className="rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                <Box className="flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-3">
                        <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF0FF]">
                            <InlineIcon icon={Sparkles} className="h-[18px] w-[18px] text-[#5140F0]" />
                        </Box>
                        <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                            Plan de progrès
                        </Text>
                    </Box>
                    <ContextualLink
                        href={stepsHref}
                        className="flex h-9 items-center gap-2 rounded-lg border border-[#C9C2FB] bg-white px-3 text-[13px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                    >
                        <InlineIcon icon={Sparkles} className="h-4 w-4" />
                        S&apos;améliorer avec l&apos;IA
                    </ContextualLink>
                </Box>
                <Box className="mt-4 space-y-4">
                    {(evaluation.planEtapes ?? [evaluation.planEtape]).map((plan) => (
                        <Box key={`${plan.number}-${plan.title}`} className="space-y-3">
                            <Box className="inline-flex min-h-7 items-center rounded-lg bg-[#EEF0FF] px-3 py-1 text-[12px] font-bold text-[#5140F0]">
                                Étape {plan.number} • {plan.title}
                            </Box>
                            <Box className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5140F0]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">
                                    {plan.text}
                                </Text>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </CardSurface>

            <CardSurface className="flex flex-col gap-4 rounded-[16px] border border-[#E5E7EB] bg-[#F7F8FB] p-6 shadow-none md:flex-row md:items-center md:justify-between">
                <Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Besoin d&apos;approfondir votre analyse ?
                    </Text>
                    <Text className="mt-1 text-[14px] font-medium text-[#6B7280]">
                        Discutez en direct avec votre coach IA pour obtenir des conseils personnalisés sur votre
                        performance
                    </Text>
                </Box>
                <Button
                    onClick={onDebrief}
                    className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white transition hover:bg-[#4635E7]"
                >
                    <InlineIcon icon={Video} className="h-4 w-4" />
                    Débriefer avec mon coach IA
                </Button>
            </CardSurface>
        </Box>
    );
}

function PersonaFeedbackPanel({ evaluation }: { evaluation: Evaluation }) {
    const [tab, setTab] = useState<"avis" | "forts" | "axes">("avis");
    const tabs = [
        { key: "avis", label: "Avis du persona" },
        { key: "forts", label: "Points forts" },
        { key: "axes", label: "Axes d'amélioration" },
    ] as const;

    return (
        <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <Box role="tablist" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[#ECEEF3]">
                {tabs.map((item) => {
                    const isActive = item.key === tab;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setTab(item.key)}
                            className={`-mb-px border-b-2 pb-3 text-[14px] font-bold transition ${
                                isActive
                                    ? "border-[#5140F0] text-[#5140F0]"
                                    : "border-transparent text-[#6B7280] hover:text-[#374151]"
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </Box>
            <Box className="mt-4">
                {tab === "avis" && (
                    <Text className="text-[14px] font-medium leading-7 text-[#4B5563]">{evaluation.personaAvis}</Text>
                )}
                {tab === "forts" && (
                    <Box className="space-y-2.5">
                        {evaluation.pointsPositifs.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                )}
                {tab === "axes" && (
                    <Box className="space-y-2.5">
                        {evaluation.axesAmelioration.map((item) => (
                            <Box key={item} className="flex gap-2.5">
                                <Box className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E11D48]" />
                                <Text className="text-[14px] font-medium leading-6 text-[#4B5563]">{item}</Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </CardSurface>
    );
}

function CoachDebriefPanel({ evaluation }: { evaluation: Evaluation }) {
    return (
        <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <Box className="flex items-center gap-3">
                <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FD]">
                    <InlineIcon icon={Phone} className="h-[18px] w-[18px] text-[#8B2FD6]" />
                </Box>
                <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                    Appréciation globale par le coach IA
                </Text>
            </Box>
            <Text className="mt-4 text-[14px] font-medium leading-7 text-[#4B5563]">{evaluation.coachAppreciation}</Text>
        </CardSurface>
    );
}

function MethodologieTab({
    evaluation,
    onOpenDetail,
    personaName,
}: {
    evaluation: Evaluation;
    onOpenDetail: (step: EvaluationStep) => void;
    personaName: string;
}) {
    return (
        <Box className="space-y-4">
            {evaluation.steps.map((step) => (
                <MethodologieStep
                    key={step.number}
                    step={step}
                    personaName={personaName}
                    onOpenDetail={onOpenDetail}
                />
            ))}
        </Box>
    );
}

function StepSectionList({ items, tone }: { items: string[]; tone: "green" | "orange" }) {
    return (
        <Box className={uiTokens.stepBlock.list}>
            {items.map((item) => (
                <Box key={item} className={uiTokens.stepBlock.item}>
                    <Box className={cn(uiTokens.stepBlock.dot, uiTokens.stepBlock.tone[tone].dot)} />
                    <Text className={uiTokens.stepBlock.text}>{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

/** Teinte de la pastille de score d'un critère, dérivée du ratio points obtenus / points max. */
function criterionScoreTone(points: string): { bg: string; text: string } {
    const [awardedRaw, maxRaw] = points.split("/");
    const awarded = Number.parseFloat((awardedRaw ?? "").trim());
    const max = Number.parseFloat((maxRaw ?? "").trim());

    if (!max || Number.isNaN(awarded)) {
        return { bg: "#F3F4F6", text: "#6B7280" };
    }

    const ratio = awarded / max;
    if (ratio >= 1) {
        return { bg: "#DCFCE7", text: "#15803D" };
    }
    if (ratio > 0) {
        return { bg: "#FFEDD5", text: "#C2410C" };
    }
    return { bg: "#FEE2E2", text: "#DC2626" };
}

/** Tableau « Analyse des critères » affiché dans l'accordéon d'une étape. */
function StepCriteriaTable({
    criteria,
    onOpenDetail,
}: {
    criteria: EvaluationCriterion[];
    onOpenDetail: () => void;
}) {
    if (criteria.length === 0) {
        return null;
    }

    return (
        <Box className="overflow-hidden rounded-[14px] border border-[#E5E7EB]">
            <Box className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <Box className="flex flex-wrap items-center gap-2">
                    <Box className="flex items-center gap-2">
                        <InlineIcon icon={Layers} className="h-[18px] w-[18px] text-[#5140F0]" />
                        <Text as="h3" className="text-[15px] font-extrabold text-[#111827]">
                            Analyse des critères
                        </Text>
                    </Box>
                    <Button
                        onClick={onOpenDetail}
                        className={cn(uiTokens.action.accentSecondaryButton, "whitespace-nowrap")}
                    >
                        <InlineIcon icon={Eye} className="h-4 w-4" />
                        Voir l&apos;analyse détaillée
                    </Button>
                </Box>
                <Text className="shrink-0 text-[13px] font-semibold text-[#9CA3AF]">
                    {criteria.length} critère{criteria.length > 1 ? "s" : ""}
                </Text>
            </Box>
            <Box className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-[12px]">
                    <thead>
                        <tr className="border-y border-[#ECEEF3] bg-[#F7F8FB] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#9CA3AF]">
                            <th className="px-4 py-2.5 font-semibold">Critère clé</th>
                            <th className="w-20 px-3 py-2.5 text-center font-semibold">Score</th>
                            <th className="px-4 py-2.5 font-semibold">Preuves observées</th>
                            <th className="px-4 py-2.5 font-semibold">Conseils d&apos;améliorations</th>
                            <th className="px-4 py-2.5 font-semibold">Verbatim préconisé</th>
                        </tr>
                    </thead>
                    <tbody>
                        {criteria.map((criterion) => {
                            const tone = criterionScoreTone(criterion.points);
                            const preuves = criterion.preuvesObservees.map((proof) => proof.quote).join(" / ");

                            return (
                                <tr key={criterion.critere} className="border-b border-[#ECEEF3] align-top last:border-b-0">
                                    <td className="px-4 py-3">
                                        <Text className="text-[12px] font-medium leading-snug text-[#1F2937]">
                                            {criterion.critere}
                                        </Text>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <Text
                                            as="span"
                                            className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                            style={{ backgroundColor: tone.bg, color: tone.text }}
                                        >
                                            {criterion.points}
                                        </Text>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Text className="text-[12px] italic leading-relaxed text-[#4B5563]">
                                            {preuves || "—"}
                                        </Text>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Text className="text-[12px] leading-relaxed text-[#5140F0]">
                                            {criterion.conseils}
                                        </Text>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Text className="block rounded-lg bg-[#E7F9ED] px-2 py-1 text-[12px] italic leading-relaxed text-[#1F7A3D]">
                                            « {criterion.verbatim} »
                                        </Text>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}

function MethodologieStep({
    step,
    onOpenDetail,
    personaName,
}: {
    step: EvaluationStep;
    onOpenDetail: (step: EvaluationStep) => void;
    personaName: string;
}) {
    const [open, setOpen] = useState(false);
    const iconConfig = stepIcons[step.icon];
    const status = stepStatusStyles[step.status];
    const reussis = step.criteresReussis ?? [];
    const ameliorer = step.criteresAAmeliorer ?? [];
    const transcript = step.stepTranscript;
    const reformulations = step.reformulations ?? [];

    return (
        <CardSurface className="overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none">
            <Box className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                    className="flex flex-1 items-center gap-4 text-left"
                >
                    <Box
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: iconConfig.bg, color: iconConfig.color }}
                    >
                        <InlineIcon icon={iconConfig.icon} className="h-5 w-5" />
                    </Box>
                    <Text as="h3" className="text-[16px] font-bold text-[#111827]">
                        Étape {step.number} : {step.title}
                    </Text>
                </button>
                <Box className="flex items-center gap-4">
                    <Ring score={step.score} size={64} stroke={7} />
                    <Box
                        className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-bold"
                        style={{ backgroundColor: status.bg, color: status.text }}
                    >
                        {step.status}
                    </Box>
                    <button
                        type="button"
                        aria-label={open ? "Replier l'étape" : "Déplier l'étape"}
                        onClick={() => setOpen((value) => !value)}
                        className="text-[#9CA3AF] transition hover:text-[#111827]"
                    >
                        <InlineIcon
                            icon={ChevronDown}
                            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                    </button>
                </Box>
            </Box>

            {open && (
                <Box className="space-y-4 border-t border-[#ECEEF3] px-5 py-5">
                    {step.commentaireCoach && (
                        <Box className={cn("rounded-[14px] border p-5", uiTokens.stepBlock.tone.blue.surface)}>
                            <Box className="flex items-center gap-2">
                                <InlineIcon
                                    icon={MessageSquare}
                                    className={cn("h-4 w-4", uiTokens.stepBlock.tone.blue.accent)}
                                />
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
                        <Box className="grid gap-4 md:grid-cols-2">
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
                                    <StepSectionList items={reussis} tone="green" />
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
                                    <StepSectionList items={ameliorer} tone="orange" />
                                </Box>
                            )}
                        </Box>
                    )}

                    <StepCriteriaTable
                        criteria={step.criteria}
                        onOpenDetail={() => onOpenDetail(step)}
                    />

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
            )}
        </CardSurface>
    );
}

function StepDetailModal({ step, onClose }: { step: EvaluationStep; onClose: () => void }) {
    return (
        <Modal title={`Étape ${step.number} : ${step.title}`} onClose={onClose} className="max-w-[1120px]">
            <Text as="h3" className="text-[15px] font-extrabold text-[#111827]">
                Grille d&apos;analyse détaillée
            </Text>
            <Box className="mt-4 overflow-x-auto rounded-[12px] border border-[#E5E7EB]">
                <table className="w-full min-w-[1040px] border-collapse text-left">
                    <thead>
                        <tr className="bg-[#F7F8FB] text-[13px] font-bold text-[#4B5563]">
                            {[
                                "Critère clé",
                                "Compétence",
                                "Points",
                                "Preuves attendues",
                                "Preuves observées",
                                "Analyse",
                                "Conseils d'améliorations",
                                "Verbatim préconisé",
                            ].map((header) => (
                                <th key={header} className="px-4 py-3 align-top">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {step.criteria.map((criterion) => (
                            <tr key={criterion.critere} className="border-t border-[#ECEEF3] align-top text-[13px]">
                                <td className="px-4 py-4 font-bold text-[#111827]">{criterion.critere}</td>
                                <td className="px-4 py-4 font-medium text-[#9CA3AF]">
                                    {criterion.competence ?? "—"}
                                </td>
                                <td className="px-4 py-4">
                                    <Box className="inline-flex items-center rounded-md bg-[#FEF3C7] px-2 py-1 text-[12px] font-bold text-[#B45309]">
                                        {criterion.points}
                                    </Box>
                                </td>
                                <td className="px-4 py-4 font-medium leading-6 text-[#4B5563]">
                                    {criterion.preuvesAttendues}
                                </td>
                                <td className="px-4 py-4">
                                    {criterion.preuvesObservees.length === 0 ? (
                                        <Text className="text-[#9CA3AF]">-</Text>
                                    ) : (
                                        <Box className="space-y-3">
                                            {criterion.preuvesObservees.map((proof, proofIndex) => (
                                                <Box key={proofIndex}>
                                                    <Text className="font-medium italic leading-6 text-[#374151]">
                                                        « {proof.quote} »
                                                    </Text>
                                                    <Text className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                                                        {proof.speaker} · {proof.time}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </td>
                                <td className="px-4 py-4 font-medium leading-6 text-[#4B5563]">{criterion.analyse}</td>
                                <td className="px-4 py-4 font-medium leading-6 text-[#5140F0]">{criterion.conseils}</td>
                                <td className="px-4 py-4">
                                    <Box className="rounded-lg bg-[#E7F9ED] px-3 py-2 font-medium italic leading-6 text-[#1F7A3D]">
                                        « {criterion.verbatim} »
                                    </Box>
                                </td>
                            </tr>
                        ))}
                        <tr className="border-t border-[#ECEEF3] bg-[#F7F8FB] text-[13px] font-extrabold text-[#111827]">
                            <td className="px-4 py-3" colSpan={2}>
                                TOTAL
                            </td>
                            <td className="px-4 py-3" colSpan={4}>
                                {step.total}
                            </td>
                            <td className="px-4 py-3">SCORE</td>
                            <td className="px-4 py-3" style={{ color: scoreColor(step.score) }}>
                                {step.score}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Box>
        </Modal>
    );
}

function TranscriptionTab({
    query,
    onQueryChange,
    messages,
    personaName,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    messages: Evaluation["transcript"];
    personaName: string;
}) {
    return (
        <Box>
            <Box className="relative mb-5">
                <InlineIcon
                    icon={Search}
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Rechercher dans la transcription..."
                    aria-label="Rechercher dans la transcription"
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                />
            </Box>

            <CardSurface className="space-y-5 rounded-[16px] border border-[#E5E7EB] p-6 shadow-none">
                {messages.length === 0 ? (
                    <Text className="py-6 text-center text-[14px] font-semibold text-[#9CA3AF]">
                        Aucun résultat dans la transcription.
                    </Text>
                ) : (
                    messages.map((message, index) => {
                        const isPersona = message.speaker === "persona";
                        return (
                            <Box
                                key={index}
                                className={`flex gap-3 ${isPersona ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Box
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                        isPersona ? "bg-[#5140F0] text-white" : "bg-[#EEF0F5] text-[#6B7280]"
                                    }`}
                                >
                                    {isPersona ? "AI" : "Moi"}
                                </Box>
                                <Box className={`max-w-[78%] ${isPersona ? "text-right" : "text-left"}`}>
                                    <Box
                                        className={`flex items-center gap-2 text-[12px] font-semibold text-[#9CA3AF] ${
                                            isPersona ? "justify-end" : "justify-start"
                                        }`}
                                    >
                                        <Text as="span">{isPersona ? personaName : "You"}</Text>
                                        <Text as="span">{message.time}</Text>
                                    </Box>
                                    <Box
                                        className={`mt-1.5 rounded-2xl px-4 py-2.5 text-[14px] font-medium leading-6 ${
                                            isPersona
                                                ? "bg-[#EEF0FF] text-[#1F2433]"
                                                : "bg-[#F3F4F6] text-[#1F2433]"
                                        }`}
                                    >
                                        {message.text}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </CardSurface>
        </Box>
    );
}

function ScoreInfoDrawer({ evaluation, onClose }: { evaluation: Evaluation; onClose: () => void }) {
    const scoreDetails = buildEvaluationScoreDetails(evaluation);
    const totalLevel = scoreLevel(scoreDetails.total);

    return (
        <Drawer
            title="Calcul du score global"
            description="Détail de la méthode de calcul et contribution de chaque étape"
            onClose={onClose}
        >
            <Box className="space-y-3">
                {scoreDetails.rows.map(({ contribution, poids, score, stepNumber, title }) => {
                    const step = evaluation.steps.find((item) => item.number === stepNumber);
                    const icon = stepIcons[step?.icon ?? "phone"];
                    const level = scoreLevel(score);

                    return (
                        <Box
                            key={title}
                            className="rounded-[14px] border border-[#E5E7EB] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
                        >
                            <Box className="flex items-center gap-3">
                                <Box
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: icon.bg, color: icon.color }}
                                >
                                    <InlineIcon icon={icon.icon} className="h-4 w-4" />
                                </Box>
                                <Text as="h3" className="text-[15px] font-bold text-[#111827]">
                                    {title}
                                </Text>
                            </Box>
                            <Box className="mt-3 grid grid-cols-3 gap-2">
                                <Box>
                                    <Text className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Poids
                                    </Text>
                                    <Text className="mt-0.5 text-[16px] font-extrabold text-[#111827]">{poids}%</Text>
                                </Box>
                                <Box>
                                    <Text className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Score étape
                                    </Text>
                                    <Text
                                        as="span"
                                        className={cn(
                                            "mt-1",
                                            uiTokens.progression.scorePill,
                                            uiTokens.progression.level[level].pill,
                                        )}
                                    >
                                        {score}%
                                    </Text>
                                </Box>
                                <Box>
                                    <Text className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9CA3AF]">
                                        Contribution
                                    </Text>
                                    <Text className="mt-0.5 text-[16px] font-extrabold" style={{ color: icon.color }}>
                                        {contribution.toFixed(1)} pts
                                    </Text>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            <Box className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-[#F4F3FE] px-4 py-4">
                <Box>
                    <Text className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#5140F0]">
                        Score total
                    </Text>
                    <Text className="text-[12px] font-medium text-[#6B7280]">
                        Somme pondérée des {evaluation.steps.length} étapes
                    </Text>
                </Box>
                <Text
                    className={cn(
                        "shrink-0 rounded-xl px-3 py-2 text-[22px] font-extrabold",
                        uiTokens.progression.level[totalLevel].pill,
                    )}
                >
                    {scoreDetails.total}
                    <Text as="span" className="text-[14px] font-bold opacity-70">
                        /100
                    </Text>
                </Text>
            </Box>

        </Drawer>
    );
}
