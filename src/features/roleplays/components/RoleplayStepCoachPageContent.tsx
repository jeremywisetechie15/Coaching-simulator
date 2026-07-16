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
import type { TranscriptMessage } from "@/features/roleplays/data/evaluation";
import {
    ROLEPLAY_COACH_MODE,
    ROLEPLAY_COACH_NOTE_TYPE,
    ROLEPLAY_ROUTES,
    formatRoleplayCoachMessageTime,
    isRoleplayCoachTranscriptEvent,
    type RoleplayCoachNote,
    type RoleplayCoachNoteType,
    type RoleplayCoachTranscriptMessage,
} from "@/features/roleplays/domain";
import { notify } from "@/lib/ui/feedback/toast";
import { SimulationView } from "./SimulationView";
import { MeetingNotesPanel } from "./MeetingNotesPanel";
import { RoleplayGuidanceTabsPanel, type RoleplayGuidanceTabTone } from "./RoleplayGuidanceTabsPanel";

/** « prepare » = avant la session (before_training) ; « improve » = après, depuis l'évaluation (after_training). */
export type StepCoachVariant = "prepare" | "improve";

interface RoleplayStepCoachPageContentProps {
    coachSessionId: string;
    initialTranscript?: TranscriptMessage[];
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
    initialTranscript = [],
    roleplay,
    method,
    referenceSessionId,
    step,
    stepNumber,
    variant = "prepare",
}: RoleplayStepCoachPageContentProps) {
    const router = useRouter();
    const [coachTranscript, setCoachTranscript] = useState<RoleplayCoachTranscriptMessage[]>([]);
    const [notes, setNotes] = useState<RoleplayCoachNote[]>([]);
    const [noteDraft, setNoteDraft] = useState("");
    const [noteType, setNoteType] = useState<RoleplayCoachNoteType>(ROLEPLAY_COACH_NOTE_TYPE.keyPoint);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [savedNotesSignature, setSavedNotesSignature] = useState("[]");
    const [saveFeedback, setSaveFeedback] = useState("");

    const tipItems: Record<MethodStepSection, string[]> = {
        [METHOD_STEP_SECTION.objectives]: step.objectifs,
        [METHOD_STEP_SECTION.bestPractices]: step.bonnesPratiques,
        [METHOD_STEP_SECTION.pitfalls]: step.erreurs,
        [METHOD_STEP_SECTION.posture]: step.posture,
        [METHOD_STEP_SECTION.verbatims]: step.verbatims,
    };
    const isImprove = variant === "improve";
    const coachMode = isImprove ? ROLEPLAY_COACH_MODE.afterTraining : ROLEPLAY_COACH_MODE.beforeTraining;
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
        ? `/iframe?scenario_id=${roleplay.scenarioId}&mode=coach&coach_mode=${coachMode}&step=${stepNumber}&coach_session_id=${coachSessionId}${coachIdQuery}${
            referenceSessionId ? `&ref_session_id=${encodeURIComponent(referenceSessionId)}` : ""
        }`
        : null;

    useEffect(() => {
        function receiveTranscriptMessage(event: MessageEvent<unknown>) {
            if (event.origin !== window.location.origin) return;
            if (!isRoleplayCoachTranscriptEvent(event.data)) return;
            const payload = event.data;
            if (payload.coachSessionId !== coachSessionId) return;
            if (payload.scenarioId !== roleplay.scenarioId) return;

            setCoachTranscript((current) => {
                if (current.some((message) => message.id === payload.message.id)) return current;
                return [...current, payload.message];
            });
            setSaveFeedback("");
        }

        window.addEventListener("message", receiveTranscriptMessage);
        return () => window.removeEventListener("message", receiveTranscriptMessage);
    }, [coachSessionId, roleplay.scenarioId]);

    const liveTranscript = useMemo<TranscriptMessage[]>(() => coachTranscript.map((message) => ({
        id: message.id,
        speaker: message.role === "assistant" ? "persona" : "you",
        text: message.content,
        time: formatRoleplayCoachMessageTime(message.timestamp),
    })), [coachTranscript]);
    const transcript = useMemo(
        () => [...initialTranscript, ...liveTranscript],
        [initialTranscript, liveTranscript],
    );

    const addedTranscriptMessageIds = useMemo(
        () => new Set(notes.flatMap((note) => note.sourceMessageId ? [note.sourceMessageId] : [])),
        [notes],
    );
    const notesSignature = useMemo(() => JSON.stringify(notes), [notes]);
    const isNotesDirty = notesSignature !== savedNotesSignature;

    useEffect(() => {
        if (!roleplay.scenarioId) {
            setIsLoadingNotes(false);
            return;
        }

        const abortController = new AbortController();
        const query = new URLSearchParams({
            coachMode,
            stepOrder: String(stepNumber),
        });
        if (step.id) query.set("methodStepId", step.id);

        async function loadNotes() {
            setIsLoadingNotes(true);
            setSaveFeedback("");

            try {
                const response = await fetch(
                    `${ROLEPLAY_ROUTES.api.coachNotes(roleplay.scenarioId!)}?${query.toString()}`,
                    { signal: abortController.signal },
                );
                const result = await response.json() as { error?: string; notes?: RoleplayCoachNote[] };
                if (!response.ok) throw new Error(result.error || "Impossible de charger les notes.");

                const loadedNotes = result.notes ?? [];
                setNotes(loadedNotes);
                setSavedNotesSignature(JSON.stringify(loadedNotes));
            } catch (error) {
                if (abortController.signal.aborted) return;
                setSaveFeedback(error instanceof Error ? error.message : "Impossible de charger les notes.");
            } finally {
                if (!abortController.signal.aborted) setIsLoadingNotes(false);
            }
        }

        void loadNotes();
        return () => abortController.abort();
    }, [coachMode, roleplay.scenarioId, step.id, stepNumber]);

    function addTranscriptMessageToNotes(message: TranscriptMessage) {
        if (!message.id || addedTranscriptMessageIds.has(message.id)) return;

        setNotes((current) => [...current, {
            content: message.text,
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            sourceMessageId: message.id ?? null,
            type: ROLEPLAY_COACH_NOTE_TYPE.keyPoint,
        }]);
        setSaveFeedback("");
        notify.success("Message ajouté aux notes");
    }

    function addManualNote() {
        const content = noteDraft.trim();
        if (!content) return;

        setNotes((current) => [...current, {
            content,
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            sourceMessageId: null,
            type: noteType,
        }]);
        setNoteDraft("");
        setSaveFeedback("");
        notify.success("Note ajoutée");
    }

    function deleteNote(noteId: string) {
        setNotes((current) => current.filter((note) => note.id !== noteId));
        setSaveFeedback("");
    }

    async function saveNotes() {
        if (!roleplay.scenarioId || !isNotesDirty || isSavingNotes) return;

        setIsSavingNotes(true);
        setSaveFeedback("");

        try {
            const response = await fetch(
                ROLEPLAY_ROUTES.api.coachNotes(roleplay.scenarioId),
                {
                    body: JSON.stringify({
                        coachMode,
                        methodStepId: step.id ?? null,
                        notes,
                        stepOrder: stepNumber,
                    }),
                    headers: { "Content-Type": "application/json" },
                    method: "PUT",
                },
            );

            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || "Impossible de sauvegarder les notes.");

            setSaveFeedback("Notes sauvegardées.");
            setSavedNotesSignature(notesSignature);
            notify.success("Notes sauvegardées");
        } catch (error) {
            setSaveFeedback(error instanceof Error ? error.message : "Impossible de sauvegarder les notes.");
        } finally {
            setIsSavingNotes(false);
        }
    }

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
                addedTranscriptMessageIds={addedTranscriptMessageIds}
                backLabel={backLabel}
                title={`Coach IA — ${verb} sur « ${step.title} » · ${method.name} · Étape ${stepNumber}`}
                liveTabLabel="AI Coach"
                iframeSrc={iframeSrc}
                onAddTranscriptMessage={addTranscriptMessageToNotes}
                personaName={coachName}
                transcript={transcript}
                transcriptAside={(
                    <MeetingNotesPanel
                        canSave={isNotesDirty}
                        draft={noteDraft}
                        isLoading={isLoadingNotes}
                        isSaving={isSavingNotes}
                        noteType={noteType}
                        notes={notes}
                        onAdd={addManualNote}
                        onDelete={deleteNote}
                        onDraftChange={setNoteDraft}
                        onNoteTypeChange={setNoteType}
                        onSave={saveNotes}
                        saveFeedback={saveFeedback}
                    />
                )}
                onBack={() => router.push(backHref)}
                panel={tipsPanel}
            />
    );
}
