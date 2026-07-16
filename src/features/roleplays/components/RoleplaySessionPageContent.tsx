"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    Briefcase,
    Building2,
    ExternalLink,
    FileText,
    GraduationCap,
    Target,
    User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    ContextualBackLink,
    ContextualLink,
    useContextualReturnHref,
} from "@/features/app-shell/components";
import { withReturnTo } from "@/features/app-shell/domain";
import { DiscProfileBadge } from "@/features/content/components";
import { ROLEPLAY_ANALYSIS_STEPS } from "@/features/roleplays/data/session-analysis";
import {
    difficultyBadgeStyles,
    type RoleplayItem,
} from "@/features/roleplays/data/roleplays";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { AnalysisLoaderDialog } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    getRoleplayNotationApiErrorMessage,
    isRoleplaySessionLifecycleEvent,
    ROLEPLAY_NOTATION_FEEDBACK_MESSAGES,
    ROLEPLAY_ROUTES,
    ROLEPLAY_SESSION_LIFECYCLE_STATUS,
    type RoleplaySessionLifecycleStatus,
} from "@/features/roleplays/domain";
import { notify, notifyHttpError } from "@/lib/ui/feedback/toast";
import { RoleplayDocumentsModal } from "./RoleplayDocumentsModal";
import { roleplayChipIcons } from "./roleplayChipIcons";

function FactRow({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <Box className={uiTokens.session.factRow}>
            <InlineIcon icon={icon} className={uiTokens.session.factIcon} />
            {children}
        </Box>
    );
}

function SectionRow({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <Box className={uiTokens.session.sectionRow}>
            <InlineIcon icon={icon} className={uiTokens.session.sectionIcon} />
            <Text className={uiTokens.session.sectionText}>{children}</Text>
        </Box>
    );
}

export function RoleplaySessionPageContent({ roleplay }: { roleplay: RoleplayItem }) {
    const router = useRouter();
    const roleplayReturnHref = useContextualReturnHref(ROLEPLAY_ROUTES.app.detail(roleplay.id));
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [documentsOpen, setDocumentsOpen] = useState(false);
    const [analysisStep, setAnalysisStep] = useState<number | null>(null);
    const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
    const [sessionLifecycleStatus, setSessionLifecycleStatus] = useState<RoleplaySessionLifecycleStatus | null>(null);
    const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);
    const { detail } = roleplay;
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const prepDocuments = roleplay.prepDocuments ?? [];
    const analyzing = analysisStep !== null;

    // Embarque le runtime public existant sans le modifier (contrat iframe public).
    const iframeSrc = roleplay.scenarioId ? `/iframe?scenario_id=${roleplay.scenarioId}` : null;

    useEffect(() => {
        if (analysisStep === null) return;
        if (analysisStep >= ROLEPLAY_ANALYSIS_STEPS.length - 1) return;

        const stepTimer = setTimeout(() => setAnalysisStep((step) => (step === null ? step : step + 1)), 700);
        return () => clearTimeout(stepTimer);
    }, [analysisStep]);

    useEffect(() => {
        function receiveSessionLifecycle(event: MessageEvent<unknown>) {
            if (event.origin !== window.location.origin) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (!isRoleplaySessionLifecycleEvent(event.data)) return;
            if (event.data.scenarioId !== roleplay.scenarioId) return;

            setCompletedSessionId(event.data.sessionId);
            setSessionLifecycleStatus(event.data.status);

            if (event.data.status === ROLEPLAY_SESSION_LIFECYCLE_STATUS.saved) {
                setSessionFeedback(null);
                setAnalysisStep(0);
                return;
            }

            setAnalysisStep(null);

            if (event.data.status === ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationCompleted) {
                setSessionFeedback(null);
                notify.success(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationSuccess);
                return;
            }

            if (event.data.status === ROLEPLAY_SESSION_LIFECYCLE_STATUS.skipped) {
                setSessionFeedback(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.ineligible);
                notify.warning(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.ineligible);
                return;
            }

            const errorMessage = event.data.error || ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationError;
            setSessionFeedback(errorMessage);
            notify.error(errorMessage);
        }

        window.addEventListener("message", receiveSessionLifecycle);
        return () => window.removeEventListener("message", receiveSessionLifecycle);
    }, [roleplay.scenarioId]);

    const completeSimulation = async () => {
        if (analyzing) return;

        if (!completedSessionId) {
            return;
        }

        if (sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationCompleted) {
            router.push(
                withReturnTo(
                    ROLEPLAY_ROUTES.app.sessionHistoryDetail(completedSessionId),
                    roleplayReturnHref,
                ),
            );
            return;
        }

        if (sessionLifecycleStatus !== ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationFailed) return;

        let responseStatus: number | null = null;
        setSessionLifecycleStatus(ROLEPLAY_SESSION_LIFECYCLE_STATUS.saved);
        setSessionFeedback(null);
        setAnalysisStep(0);

        try {
            const response = await fetch("/api/notation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: completedSessionId }),
            });
            const payload: unknown = await response.json().catch(() => null);
            const skipped =
                payload && typeof payload === "object" && "skipped" in payload && payload.skipped === true;

            if (skipped) {
                setAnalysisStep(null);
                setSessionLifecycleStatus(ROLEPLAY_SESSION_LIFECYCLE_STATUS.skipped);
                setSessionFeedback(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.ineligible);
                notify.warning(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.ineligible);
                return;
            }

            const sessionId =
                payload && typeof payload === "object" && "session_id" in payload
                    ? String(payload.session_id ?? "")
                    : "";

            if (!response.ok || !sessionId) {
                responseStatus = response.status;
                throw new Error(getRoleplayNotationApiErrorMessage(payload));
            }

            setAnalysisStep(null);
            setCompletedSessionId(sessionId);
            setSessionLifecycleStatus(ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationCompleted);
            notify.success(ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationSuccess);
            router.push(
                withReturnTo(
                    ROLEPLAY_ROUTES.app.sessionHistoryDetail(sessionId),
                    roleplayReturnHref,
                ),
            );
        } catch (error) {
            console.error("Erreur pendant l'évaluation complète:", error);
            setAnalysisStep(null);
            setSessionLifecycleStatus(ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationFailed);
            const errorMessage = error instanceof Error
                ? error.message
                : ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationError;
            setSessionFeedback(errorMessage);
            notifyHttpError(errorMessage, responseStatus);
        }
    };

    const canOpenEvaluation =
        Boolean(completedSessionId) &&
        sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationCompleted;
    const canRetryEvaluation =
        Boolean(completedSessionId) &&
        sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.notationFailed;
    const completionButtonLabel = canOpenEvaluation
        ? "Voir mon évaluation"
        : canRetryEvaluation
          ? "Relancer l'évaluation"
          : sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.saved
            ? "Analyse en cours..."
            : sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.skipped
              ? "Session trop courte"
              : "Terminer la simulation";
    const sessionFeedbackTone = sessionLifecycleStatus === ROLEPLAY_SESSION_LIFECYCLE_STATUS.skipped
        ? uiTokens.text.muted
        : uiTokens.text.danger;

    const analysisSteps = ROLEPLAY_ANALYSIS_STEPS.map((label, index) => ({
        label,
        status:
            analysisStep === null || index > analysisStep
                ? ("pending" as const)
                : index < analysisStep
                  ? ("done" as const)
                  : ("active" as const),
    }));

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1320px]">
                <Box className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <ContextualBackLink
                        fallbackHref={ROLEPLAY_ROUTES.app.detail(roleplay.id)}
                        showLabel
                        className={uiTokens.action.backLink}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>
                    <Box className="flex flex-col items-end gap-1.5">
                        <Button
                            onClick={completeSimulation}
                            disabled={analyzing || (!canOpenEvaluation && !canRetryEvaluation)}
                            className={cn(
                                "flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                                uiTokens.action.primaryButton,
                                analyzing && "cursor-wait opacity-80",
                            )}
                        >
                            {completionButtonLabel}
                        </Button>
                        {sessionFeedback && (
                            <Text className={cn("max-w-[420px] text-right text-[12px] font-semibold", sessionFeedbackTone)}>
                                {sessionFeedback}
                            </Text>
                        )}
                    </Box>
                </Box>

                <Box className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <CardSurface className={uiTokens.session.frameCard}>
                        {iframeSrc ? (
                            <iframe
                                ref={iframeRef}
                                title={`Simulation — ${roleplay.name}`}
                                src={iframeSrc}
                                className={uiTokens.session.frame}
                                allow="microphone; camera; autoplay"
                            />
                        ) : (
                            <Box className={uiTokens.session.frameFallback}>
                                <InlineIcon icon={AlertCircle} className="h-12 w-12 text-[#DC2626]" />
                                <Text className="text-[15px] font-bold text-[#374151]">
                                    Simulation indisponible pour ce scénario
                                </Text>
                                <Text className="max-w-[420px] text-[13px] font-medium leading-6 text-[#6B7280]">
                                    Aucun identifiant de scénario n&apos;est associé à ce roleplay. Ajoutez un{" "}
                                    <code className="rounded bg-white px-1.5 py-0.5 text-[12px]">scenarioId</code> au
                                    roleplay pour activer la session.
                                </Text>
                            </Box>
                        )}
                    </CardSurface>

                    <CardSurface className={uiTokens.session.panel}>
                        <Box className={uiTokens.session.panelHeader}>
                            <InlineIcon icon={GraduationCap} className={uiTokens.session.panelHeaderIcon} />
                            <Text as="h2" className={uiTokens.session.panelHeaderTitle}>
                                {roleplay.category}
                            </Text>
                        </Box>

                        <Box className="mt-4 space-y-2.5">
                            <FactRow icon={User}>{roleplay.name}</FactRow>
                            <FactRow icon={Briefcase}>{roleplay.role}</FactRow>
                            <FactRow icon={Building2}>{roleplay.company}</FactRow>
                            {detail.infoChips.map((chip) => (
                                <FactRow key={chip.label} icon={roleplayChipIcons[chip.icon] ?? Building2}>
                                    {chip.label}
                                </FactRow>
                            ))}
                        </Box>

                        <Box className="mt-4 flex flex-wrap gap-2">
                            <Box
                                className="inline-flex h-7 items-center rounded-lg border px-3 text-[13px] font-semibold"
                                style={{
                                    backgroundColor: difficultyStyle.bg,
                                    borderColor: difficultyStyle.border,
                                    color: difficultyStyle.text,
                                }}
                            >
                                {roleplay.difficulty}
                            </Box>
                            <DiscProfileBadge
                                profile={roleplay.disc}
                                className="h-7 border-0 px-3 text-[13px]"
                            />
                        </Box>

                        <Box className="mt-5 space-y-4">
                            <SectionRow icon={FileText}>{detail.context}</SectionRow>
                            <SectionRow icon={Target}>{roleplay.description}</SectionRow>
                        </Box>

                        <Box className="mt-5 space-y-4 border-t border-[#EDEEF3] pt-4">
                            <Button onClick={() => setDocumentsOpen(true)} className={uiTokens.session.documentsButton}>
                                <Box className="flex items-center gap-2.5">
                                    <InlineIcon icon={BookOpen} className={uiTokens.session.panelHeaderIcon} />
                                    Documents utiles
                                    <Text as="span" className={uiTokens.session.countBadge}>
                                        {prepDocuments.length}
                                    </Text>
                                </Box>
                                <InlineIcon icon={ExternalLink} className="h-4 w-4 text-[#9CA3AF]" />
                            </Button>
                            <ContextualLink
                                href={`/roleplays/${roleplay.id}/steps`}
                                className="flex items-center gap-2.5 text-[14px] font-bold text-[#374151] transition hover:text-[#5140F0]"
                            >
                                <InlineIcon icon={BookOpen} className={uiTokens.session.panelHeaderIcon} />
                                Voir les notes de préparation
                            </ContextualLink>
                        </Box>
                    </CardSurface>
                </Box>
            </Box>

            {documentsOpen && (
                <RoleplayDocumentsModal documents={prepDocuments} onClose={() => setDocumentsOpen(false)} />
            )}

            {analyzing && (
                <AnalysisLoaderDialog
                    title="Analyse en cours"
                    description="Votre coach IA analyse votre performance et prépare votre évaluation détaillée..."
                    steps={analysisSteps}
                    onClose={() => setAnalysisStep(null)}
                />
            )}
        </Box>
    );
}
