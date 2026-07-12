"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { SimulationView } from "./SimulationView";
import { MeetingNotesPanel } from "./MeetingNotesPanel";

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

type StepTabTone = keyof typeof uiTokens.stepBlock.tone;

const stepTabs: { key: MethodStepSection; label: string; icon: LucideIcon; tone: StepTabTone }[] = [
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

function TipList({ items, italic, tone }: { items: string[]; italic?: boolean; tone: StepTabTone }) {
    if (items.length === 0) {
        return <Text className={uiTokens.stepTabs.empty}>Aucune information renseignée pour cette section.</Text>;
    }

    const palette = uiTokens.stepBlock.tone[tone];

    return (
        <Box className={uiTokens.stepTabs.list}>
            {items.map((item) => (
                <Box key={item} className={uiTokens.stepTabs.item}>
                    <Box className={cn(uiTokens.stepTabs.listDot, palette.dot)} />
                    <Text className={cn(uiTokens.stepTabs.itemText, italic && "italic")}>{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

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
    const [activeTab, setActiveTab] = useState<MethodStepSection>(METHOD_STEP_SECTION.objectives);
    const [coachTranscript, setCoachTranscript] = useState<RoleplayCoachTranscriptMessage[]>([]);
    const [notes, setNotes] = useState<RoleplayCoachNote[]>([]);
    const [noteDraft, setNoteDraft] = useState("");
    const [noteType, setNoteType] = useState<RoleplayCoachNoteType>(ROLEPLAY_COACH_NOTE_TYPE.keyPoint);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [savedNotesSignature, setSavedNotesSignature] = useState("[]");
    const [saveFeedback, setSaveFeedback] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tipItems: Record<MethodStepSection, string[]> = {
        [METHOD_STEP_SECTION.objectives]: step.objectifs,
        [METHOD_STEP_SECTION.bestPractices]: step.bonnesPratiques,
        [METHOD_STEP_SECTION.pitfalls]: step.erreurs,
        [METHOD_STEP_SECTION.posture]: step.posture,
        [METHOD_STEP_SECTION.verbatims]: step.verbatims,
    };
    const activeTabConfig = stepTabs.find((tab) => tab.key === activeTab)!;

    const isImprove = variant === "improve";
    const coachMode = isImprove ? ROLEPLAY_COACH_MODE.afterTraining : ROLEPLAY_COACH_MODE.beforeTraining;
    const verb = isImprove ? "S'améliorer" : "Se préparer";
    const stepsHref = `/roleplays/${roleplay.id}/steps${
        isImprove
            ? `?coach=after${referenceSessionId ? `&sessionId=${encodeURIComponent(referenceSessionId)}` : ""}`
            : ""
    }`;
    const { href: backHref, label: backLabel } = useContextualReturn(stepsHref);

    // Embarque le runtime public existant sans le modifier (contrat iframe) ; seul `coach_mode` varie.
    const iframeSrc = roleplay.scenarioId
        ? `/iframe?scenario_id=${roleplay.scenarioId}&mode=coach&coach_mode=${coachMode}&step=${stepNumber}&coach_session_id=${coachSessionId}${
            referenceSessionId ? `&ref_session_id=${encodeURIComponent(referenceSessionId)}` : ""
        }`
        : null;

    const showToast = useCallback((message: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage(message);
        toastTimerRef.current = setTimeout(() => setToastMessage(""), 2200);
    }, []);

    useEffect(() => () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }, []);

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

    const transcript = useMemo<TranscriptMessage[]>(() => coachTranscript.map((message) => ({
        id: message.id,
        speaker: message.role === "assistant" ? "persona" : "you",
        text: message.content,
        time: formatRoleplayCoachMessageTime(message.timestamp),
    })), [coachTranscript]);

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
        showToast("Message ajouté aux notes");
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
        showToast("Note ajoutée");
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
            showToast("Notes sauvegardées");
        } catch (error) {
            setSaveFeedback(error instanceof Error ? error.message : "Impossible de sauvegarder les notes.");
        } finally {
            setIsSavingNotes(false);
        }
    }

    const tipsPanel = (
        <CardSurface className="rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <Box className={uiTokens.stepTabs.tabList}>
                {stepTabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const palette = uiTokens.stepBlock.tone[tab.tone];
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                uiTokens.stepTabs.button,
                                isActive ? palette.solid : uiTokens.stepTabs.buttonIdle,
                            )}
                        >
                            <InlineIcon icon={tab.icon} className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </Box>
            <Box className="mt-4">
                <TipList
                    items={tipItems[activeTab]}
                    italic={activeTab === METHOD_STEP_SECTION.verbatims}
                    tone={activeTabConfig.tone}
                />
            </Box>
        </CardSurface>
    );

    return (
        <>
            <SimulationView
                addedTranscriptMessageIds={addedTranscriptMessageIds}
                backLabel={backLabel}
                title={`Coach IA — ${verb} sur « ${step.title} » · ${method.name} · Étape ${stepNumber}`}
                liveTabLabel="AI Coach"
                iframeSrc={iframeSrc}
                onAddTranscriptMessage={addTranscriptMessageToNotes}
                personaName="Coach IA"
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
            {toastMessage ? (
                <Box aria-live="polite" className={uiTokens.coachNotes.toast}>{toastMessage}</Box>
            ) : null}
        </>
    );
}
