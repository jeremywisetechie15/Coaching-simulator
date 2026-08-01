"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, MessageSquare, Quote, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useContextualReturn } from "@/features/app-shell/components";
import type { Method, MethodStep } from "@/features/methods/data/methods";
import {
    METHOD_STEP_SECTION,
    METHOD_STEP_SECTION_LABELS,
    type MethodStepSection,
} from "@/features/methods/domain/method";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import {
    ROLEPLAY_COACH_MODE,
    appendRoleplayLiveTranscriptMessage,
    isMatchingRoleplayLiveTranscriptEvent,
    toRoleplayTranscriptMessages,
    type RoleplayLiveTranscriptMessage,
} from "@/features/roleplays/domain";
import { SimulationView } from "./SimulationView";
import { MeetingNotesPanel } from "./MeetingNotesPanel";
import { RoleplayGuidanceTabsPanel, type RoleplayGuidanceTabTone } from "./RoleplayGuidanceTabsPanel";
import { useRoleplayMeetingNotes } from "./useRoleplayMeetingNotes";

/** « prepare » = avant la session (before_training) ; « improve » = après, depuis l'évaluation (after_training). */
export type StepCoachVariant = "prepare" | "improve";

interface RoleplayStepCoachPageContentProps {
    coachSessionId: string;
    roleplay: RoleplayItem;
    method: Method;
    referenceSessionId?: string;
    step: MethodStep;
    /** Position de l'étape (1-indexée). */
    stepNumber: number;
    variant?: StepCoachVariant;
}

const stepTabs: { key: MethodStepSection; label: string; icon: LucideIcon; tone: RoleplayGuidanceTabTone }[] = [
    {
        key: METHOD_STEP_SECTION.objectives,
        label: METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.objectives],
        icon: Target,
        tone: "indigo",
    },
    {
        key: METHOD_STEP_SECTION.bestPractices,
        label: METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.bestPractices],
        icon: CheckCircle2,
        tone: "green",
    },
    {
        key: METHOD_STEP_SECTION.pitfalls,
        label: METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.pitfalls],
        icon: AlertTriangle,
        tone: "red",
    },
    {
        key: METHOD_STEP_SECTION.posture,
        label: METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.posture],
        icon: MessageSquare,
        tone: "blue",
    },
    {
        key: METHOD_STEP_SECTION.verbatims,
        label: METHOD_STEP_SECTION_LABELS[METHOD_STEP_SECTION.verbatims],
        icon: Quote,
        tone: "violet",
    },
];

export function RoleplayStepCoachPageContent({
    coachSessionId,
    roleplay,
    method,
    referenceSessionId,
    step,
    stepNumber,
    variant = "prepare",
}: RoleplayStepCoachPageContentProps) {
    const router = useRouter();
    const [coachTranscript, setCoachTranscript] = useState<RoleplayLiveTranscriptMessage[]>([]);

    const tipItems: Record<MethodStepSection, string[]> = {
        [METHOD_STEP_SECTION.objectives]: step.objectifs,
        [METHOD_STEP_SECTION.bestPractices]: step.bonnesPratiques,
        [METHOD_STEP_SECTION.pitfalls]: step.erreurs,
        [METHOD_STEP_SECTION.posture]: step.posture,
        [METHOD_STEP_SECTION.verbatims]: step.verbatims,
    };
    const isImprove = variant === "improve";
    const coachMode = isImprove ? ROLEPLAY_COACH_MODE.afterTraining : ROLEPLAY_COACH_MODE.beforeTraining;
    const meetingNotes = useRoleplayMeetingNotes({
        coachMode,
        methodStepId: step.id ?? null,
        roleplayId: roleplay.scenarioId ?? null,
        stepOrder: stepNumber,
    });
    const coachName = roleplay.coachName?.trim() || "Coach IA";
    const coachIdQuery = roleplay.coachId
        ? `&coach_id=${encodeURIComponent(roleplay.coachId)}`
        : "";
    const verb = isImprove ? "S'améliorer" : "Se préparer";
    const stepsHref = `/roleplays/${roleplay.id}/steps${
        isImprove
            ? `?coach=after${referenceSessionId ? `&sessionId=${encodeURIComponent(referenceSessionId)}` : ""}`
            : ""
    }`;
    const { href: backHref, label: backLabel } = useContextualReturn(stepsHref);

    // Le coach explicite garde l'affichage et le contexte alignés sur l'association courante du scénario.
    const iframeSrc = roleplay.scenarioId
        ? `/iframe?scenario_id=${roleplay.scenarioId}&mode=coach&coach_mode=${coachMode}&step=${stepNumber}&transcript_session_id=${coachSessionId}${coachIdQuery}${
            referenceSessionId ? `&ref_session_id=${encodeURIComponent(referenceSessionId)}` : ""
        }`
        : null;

    useEffect(() => {
        function receiveTranscriptMessage(event: MessageEvent<unknown>) {
            if (event.origin !== window.location.origin) return;
            if (!roleplay.scenarioId) return;
            if (!isMatchingRoleplayLiveTranscriptEvent(event.data, {
                scenarioId: roleplay.scenarioId,
                transcriptSessionId: coachSessionId,
            })) return;
            const payload = event.data;

            setCoachTranscript((current) => appendRoleplayLiveTranscriptMessage(current, payload.message));
        }

        window.addEventListener("message", receiveTranscriptMessage);
        return () => window.removeEventListener("message", receiveTranscriptMessage);
    }, [coachSessionId, roleplay.scenarioId]);

    // Le transcript du roleplay reste un contexte IA invisible via referenceSessionId.
    // L'onglet Transcription affiche uniquement l'échange de la session coach courante.
    const visibleCoachTranscript = useMemo(
        () => toRoleplayTranscriptMessages(coachTranscript),
        [coachTranscript],
    );

    const tipsPanel = (
        <RoleplayGuidanceTabsPanel
            ariaLabel="Détails de l'étape"
            initialTab={METHOD_STEP_SECTION.objectives}
            tabs={stepTabs.map((tab) => ({
                ...tab,
                italic: tab.key === METHOD_STEP_SECTION.verbatims,
                items: tipItems[tab.key],
            }))}
        />
    );

    return (
        <SimulationView
                addedTranscriptMessageIds={meetingNotes.addedTranscriptMessageIds}
                assistantName={coachName}
                backLabel={backLabel}
                title={`Coach IA — ${verb} sur « ${step.title} » · ${method.name} · Étape ${stepNumber}`}
                liveTabLabel="AI Coach"
                iframeSrc={iframeSrc}
                onAddTranscriptMessage={meetingNotes.addTranscriptMessageToNotes}
                transcript={visibleCoachTranscript}
                transcriptAside={(
                    <MeetingNotesPanel
                        canSave={meetingNotes.canSave}
                        draft={meetingNotes.draft}
                        isLoading={meetingNotes.isLoading}
                        isSaving={meetingNotes.isSaving}
                        noteType={meetingNotes.noteType}
                        notes={meetingNotes.notes}
                        onAdd={meetingNotes.addManualNote}
                        onDelete={meetingNotes.deleteNote}
                        onDraftChange={meetingNotes.setDraft}
                        onNoteTypeChange={meetingNotes.setNoteType}
                        onSave={meetingNotes.saveNotes}
                        saveFeedback={meetingNotes.saveFeedback}
                    />
                )}
                onBack={() => router.push(backHref)}
                panel={tipsPanel}
            />
    );
}
