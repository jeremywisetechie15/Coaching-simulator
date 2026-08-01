"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Save, X } from "lucide-react";
import {
    ROLEPLAY_COACH_NOTE_TYPES,
    ROLEPLAY_COACH_NOTE_TYPE_LABELS,
    ROLEPLAY_ROUTES,
    countRoleplayCoachNotes,
    formatRoleplayCoachNotesSavedAt,
    groupRoleplayCoachNotesByStep,
    replaceRoleplayCoachNoteGroup,
    type RoleplayCoachNoteGroup,
    type RoleplayCoachNoteType,
    updateRoleplayCoachNote,
} from "@/features/roleplays/domain";
import { Box, Button, InlineIcon, SelectInput, Text, TextArea, Tooltip } from "@/lib/ui/atoms";
import { notify } from "@/lib/ui/feedback/toast";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RoleplayCoachNotesModalProps {
    groups: RoleplayCoachNoteGroup[];
    onClose: () => void;
    onGroupSaved?: (group: RoleplayCoachNoteGroup) => void;
    roleplayId: string;
    title: string;
}

export function RoleplayCoachNotesModal({
    groups,
    onClose,
    onGroupSaved,
    roleplayId,
    title,
}: RoleplayCoachNotesModalProps) {
    const [savedGroups, setSavedGroups] = useState(groups);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [draftContent, setDraftContent] = useState("");
    const [draftType, setDraftType] = useState<RoleplayCoachNoteType | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState("");
    const noteCount = countRoleplayCoachNotes(savedGroups);
    const stepGroups = groupRoleplayCoachNotesByStep(savedGroups);
    const isPlural = noteCount !== 1;

    function startEditing(group: RoleplayCoachNoteGroup, noteId: string) {
        const note = group.notes.find((candidate) => candidate.id === noteId);
        if (!note || isSaving) return;

        setEditingNoteId(note.id);
        setDraftContent(note.content);
        setDraftType(note.type);
        setSaveFeedback("");
    }

    function cancelEditing() {
        if (isSaving) return;
        setEditingNoteId(null);
        setDraftContent("");
        setDraftType(null);
        setSaveFeedback("");
    }

    async function saveEditedNote(group: RoleplayCoachNoteGroup, noteId: string) {
        const content = draftContent.trim();
        if (!content || !draftType || isSaving) return;

        const updatedGroup = updateRoleplayCoachNote(group, noteId, {
            content,
            type: draftType,
        });
        setIsSaving(true);
        setSaveFeedback("");

        try {
            const response = await fetch(ROLEPLAY_ROUTES.api.coachNotes(roleplayId), {
                body: JSON.stringify({
                    coachMode: updatedGroup.coachMode,
                    methodStepId: updatedGroup.methodStepId,
                    notes: updatedGroup.notes,
                    sessionId: updatedGroup.sessionId,
                    stepOrder: updatedGroup.sessionId ? null : updatedGroup.stepOrder,
                }),
                headers: { "Content-Type": "application/json" },
                method: "PUT",
            });
            const result = await response.json() as { error?: string; savedAt?: string };
            if (!response.ok || !result.savedAt) {
                throw new Error(result.error || "Impossible de modifier cette note.");
            }

            const persistedGroup = { ...updatedGroup, savedAt: result.savedAt };
            setSavedGroups((current) => replaceRoleplayCoachNoteGroup(current, persistedGroup));
            onGroupSaved?.(persistedGroup);
            setEditingNoteId(null);
            setDraftContent("");
            setDraftType(null);
            setSaveFeedback("Note modifiée et sauvegardée.");
            notify.success("Note modifiée");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible de modifier cette note.";
            setSaveFeedback(message);
            notify.error(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Modal
            className="max-w-[680px]"
            description={`${noteCount} note${isPlural ? "s" : ""} enregistrée${isPlural ? "s" : ""}`}
            onClose={onClose}
            title={title}
        >
            <Box className={uiTokens.coachNotes.viewer.list}>
                {stepGroups.length === 0 ? (
                    <Text className={uiTokens.coachNotes.viewer.empty}>
                        Aucune note enregistrée pour le moment.
                    </Text>
                ) : stepGroups.map((stepGroup) => (
                    <Box key={stepGroup.contextKey} className={uiTokens.coachNotes.viewer.group}>
                        <Box className={uiTokens.coachNotes.viewer.groupHeader}>
                            <Box className={uiTokens.coachNotes.viewer.groupIcon}>
                                <InlineIcon icon={CalendarDays} className={uiTokens.coachNotes.viewer.groupIconSvg} />
                            </Box>
                            <Box className="min-w-0 flex-1">
                                <Text className={uiTokens.coachNotes.viewer.groupTitle}>
                                    {stepGroup.sessionId
                                        ? stepGroup.stepTitle
                                        : `Étape ${stepGroup.stepOrder} · ${stepGroup.stepTitle}`}
                                </Text>
                                <Text className={uiTokens.coachNotes.viewer.groupMeta}>
                                    Dernière modification le{" "}
                                    {formatRoleplayCoachNotesSavedAt(stepGroup.savedAt)} · {stepGroup.entries.length} note
                                    {stepGroup.entries.length > 1 ? "s" : ""}
                                </Text>
                            </Box>
                        </Box>

                        <Box className={uiTokens.coachNotes.viewer.notes}>
                            {stepGroup.entries.map(({ group, note }) => {
                                const tone = uiTokens.coachNotes.typeTone[note.type];
                                const isEditing = editingNoteId === note.id;

                                return (
                                    <Box key={note.id} className={cn(uiTokens.coachNotes.viewer.note, tone.surface)}>
                                        {isEditing ? (
                                            <Box className={uiTokens.coachNotes.viewer.editForm}>
                                                <TextArea
                                                    aria-label="Contenu de la note"
                                                    autoFocus
                                                    className={uiTokens.coachNotes.viewer.editTextarea}
                                                    disabled={isSaving}
                                                    maxLength={10_000}
                                                    onChange={(event) => setDraftContent(event.target.value)}
                                                    value={draftContent}
                                                />
                                                <Box className={uiTokens.coachNotes.viewer.editFooter}>
                                                    <SelectInput
                                                        aria-label="Type de note"
                                                        className={uiTokens.coachNotes.viewer.editSelect}
                                                        density="sm"
                                                        disabled={isSaving}
                                                        onChange={(event) => setDraftType(event.target.value as RoleplayCoachNoteType)}
                                                        value={draftType ?? note.type}
                                                    >
                                                        {ROLEPLAY_COACH_NOTE_TYPES.map((type) => (
                                                            <option key={type} value={type}>
                                                                {ROLEPLAY_COACH_NOTE_TYPE_LABELS[type]}
                                                            </option>
                                                        ))}
                                                    </SelectInput>
                                                    <Box className={uiTokens.coachNotes.viewer.editActions}>
                                                        <Button
                                                            className={uiTokens.coachNotes.viewer.cancelEditButton}
                                                            disabled={isSaving}
                                                            onClick={cancelEditing}
                                                        >
                                                            <InlineIcon icon={X} className={uiTokens.coachNotes.actionIcon} />
                                                            Annuler
                                                        </Button>
                                                        <Button
                                                            className={uiTokens.coachNotes.viewer.saveEditButton}
                                                            disabled={isSaving || !draftContent.trim()}
                                                            onClick={() => void saveEditedNote(group, note.id)}
                                                        >
                                                            <InlineIcon icon={Save} className={uiTokens.coachNotes.actionIcon} />
                                                            {isSaving ? "Sauvegarde..." : "Enregistrer"}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <>
                                                <Box className={uiTokens.coachNotes.viewer.noteHeader}>
                                                    <Box className={cn(uiTokens.coachNotes.typeBadge, tone.badge)}>
                                                        {ROLEPLAY_COACH_NOTE_TYPE_LABELS[note.type]}
                                                    </Box>
                                                    <Tooltip content="Modifier cette note">
                                                        <Button
                                                            aria-label="Modifier la note"
                                                            className={uiTokens.coachNotes.viewer.editButton}
                                                            disabled={isSaving}
                                                            onClick={() => startEditing(group, note.id)}
                                                        >
                                                            <InlineIcon icon={Pencil} className={uiTokens.coachNotes.viewer.editIcon} />
                                                        </Button>
                                                    </Tooltip>
                                                </Box>
                                                <Text className={uiTokens.coachNotes.viewer.noteText}>
                                                    {note.content}
                                                </Text>
                                            </>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
                {savedGroups.length > 0 && (
                    <Text aria-live="polite" className={uiTokens.coachNotes.viewer.feedback}>
                        {saveFeedback}
                    </Text>
                )}
            </Box>
        </Modal>
    );
}
