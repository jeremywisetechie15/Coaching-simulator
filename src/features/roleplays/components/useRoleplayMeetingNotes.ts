"use client";

import { useEffect, useMemo, useState } from "react";
import type { TranscriptMessage } from "@/features/roleplays/data/evaluation";
import {
    ROLEPLAY_COACH_NOTE_TYPE,
    ROLEPLAY_ROUTES,
    type RoleplayCoachMode,
    type RoleplayCoachNote,
    type RoleplayCoachNoteType,
} from "@/features/roleplays/domain";
import { notify } from "@/lib/ui/feedback/toast";

export interface RoleplayMeetingNotesContext {
    coachMode: RoleplayCoachMode;
    methodStepId?: string | null;
    sessionId?: string | null;
    stepOrder?: number | null;
}

interface UseRoleplayMeetingNotesOptions extends RoleplayMeetingNotesContext {
    roleplayId: string | null;
}

export function useRoleplayMeetingNotes({
    coachMode,
    methodStepId = null,
    roleplayId,
    sessionId = null,
    stepOrder = null,
}: UseRoleplayMeetingNotesOptions) {
    const [notes, setNotes] = useState<RoleplayCoachNote[]>([]);
    const [noteDraft, setNoteDraft] = useState("");
    const [noteType, setNoteType] = useState<RoleplayCoachNoteType>(ROLEPLAY_COACH_NOTE_TYPE.keyPoint);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [savedNotesSignature, setSavedNotesSignature] = useState("[]");
    const [saveFeedback, setSaveFeedback] = useState("");
    const notesSignature = useMemo(() => JSON.stringify(notes), [notes]);
    const isNotesDirty = notesSignature !== savedNotesSignature;
    const addedTranscriptMessageIds = useMemo(
        () => new Set(notes.flatMap((note) => note.sourceMessageId ? [note.sourceMessageId] : [])),
        [notes],
    );

    useEffect(() => {
        setNotes([]);
        setSavedNotesSignature("[]");
        setSaveFeedback("");

        if (!roleplayId) {
            setIsLoadingNotes(false);
            return;
        }

        const abortController = new AbortController();
        const query = new URLSearchParams({ coachMode });
        if (methodStepId) query.set("methodStepId", methodStepId);
        if (sessionId) query.set("sessionId", sessionId);
        if (stepOrder !== null) query.set("stepOrder", String(stepOrder));

        async function loadNotes() {
            setIsLoadingNotes(true);

            try {
                const response = await fetch(
                    `${ROLEPLAY_ROUTES.api.coachNotes(roleplayId!)}?${query.toString()}`,
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
    }, [coachMode, methodStepId, roleplayId, sessionId, stepOrder]);

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
        if (!roleplayId || !isNotesDirty || isSavingNotes) return;

        setIsSavingNotes(true);
        setSaveFeedback("");

        try {
            const response = await fetch(ROLEPLAY_ROUTES.api.coachNotes(roleplayId), {
                body: JSON.stringify({
                    coachMode,
                    methodStepId,
                    notes,
                    sessionId,
                    stepOrder,
                }),
                headers: { "Content-Type": "application/json" },
                method: "PUT",
            });
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

    return {
        addManualNote,
        addedTranscriptMessageIds,
        addTranscriptMessageToNotes,
        canSave: isNotesDirty,
        deleteNote,
        draft: noteDraft,
        isLoading: isLoadingNotes,
        isSaving: isSavingNotes,
        noteType,
        notes,
        saveFeedback,
        saveNotes,
        setDraft: setNoteDraft,
        setNoteType,
    };
}
