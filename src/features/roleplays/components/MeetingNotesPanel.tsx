"use client";

import { Check, Lightbulb, Plus, Save, Trash2 } from "lucide-react";
import {
    ROLEPLAY_COACH_NOTE_TYPE,
    ROLEPLAY_COACH_NOTE_TYPE_LABELS,
    ROLEPLAY_COACH_NOTE_TYPES,
    formatRoleplayCoachMessageTime,
    type RoleplayCoachNote,
    type RoleplayCoachNoteType,
} from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, SelectInput, Text, TextArea, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface MeetingNotesPanelProps {
    canSave: boolean;
    draft: string;
    isLoading: boolean;
    isSaving: boolean;
    noteType: RoleplayCoachNoteType;
    notes: RoleplayCoachNote[];
    onAdd: () => void;
    onDelete: (noteId: string) => void;
    onDraftChange: (value: string) => void;
    onNoteTypeChange: (value: RoleplayCoachNoteType) => void;
    onSave: () => void;
    saveFeedback: string;
}

const noteTypeIcons = {
    [ROLEPLAY_COACH_NOTE_TYPE.example]: Check,
    [ROLEPLAY_COACH_NOTE_TYPE.keyPoint]: Lightbulb,
    [ROLEPLAY_COACH_NOTE_TYPE.suggestion]: Plus,
} as const;

export function MeetingNotesPanel({
    canSave,
    draft,
    isLoading,
    isSaving,
    noteType,
    notes,
    onAdd,
    onDelete,
    onDraftChange,
    onNoteTypeChange,
    onSave,
    saveFeedback,
}: MeetingNotesPanelProps) {
    return (
        <CardSurface className={uiTokens.coachNotes.panel}>
            <Box className={uiTokens.coachNotes.header}>
                <Box>
                    <Text as="h2" className={uiTokens.coachNotes.title}>Meeting Notes</Text>
                    <Text className={uiTokens.coachNotes.subtitle}>{notes.length} note{notes.length > 1 ? "s" : ""}</Text>
                </Box>
            </Box>

            <Box className={uiTokens.coachNotes.composer}>
                <TextArea
                    aria-label="Ajouter une note"
                    className={uiTokens.coachNotes.textarea}
                    disabled={isLoading}
                    onChange={(event) => onDraftChange(event.target.value)}
                    placeholder="Ajouter une note..."
                    value={draft}
                />
                <Box className={uiTokens.coachNotes.composerActions}>
                    <SelectInput
                        aria-label="Type de note"
                        className={uiTokens.coachNotes.select}
                        density="sm"
                        disabled={isLoading}
                        onChange={(event) => onNoteTypeChange(event.target.value as RoleplayCoachNoteType)}
                        value={noteType}
                    >
                        {ROLEPLAY_COACH_NOTE_TYPES.map((type) => (
                            <option key={type} value={type}>{ROLEPLAY_COACH_NOTE_TYPE_LABELS[type]}</option>
                        ))}
                    </SelectInput>
                    <Button
                        className={uiTokens.coachNotes.addButton}
                        disabled={isLoading || !draft.trim()}
                        onClick={onAdd}
                    >
                        <InlineIcon icon={Plus} className={uiTokens.coachNotes.actionIcon} />
                        Ajouter
                    </Button>
                </Box>
            </Box>

            <Box className={uiTokens.coachNotes.list}>
                {isLoading ? (
                    <Text className={uiTokens.coachNotes.empty}>Chargement des notes...</Text>
                ) : notes.length === 0 ? (
                    <Text className={uiTokens.coachNotes.empty}>Aucune note pour le moment.</Text>
                ) : notes.map((note) => {
                    const tone = uiTokens.coachNotes.typeTone[note.type];
                    const NoteIcon = noteTypeIcons[note.type];

                    return (
                        <Box key={note.id} className={cn(uiTokens.coachNotes.note, tone.surface)}>
                            <Box className={uiTokens.coachNotes.noteHeader}>
                                <Box className={cn(uiTokens.coachNotes.typeBadge, tone.badge)}>
                                    <InlineIcon icon={NoteIcon} className={uiTokens.coachNotes.typeIcon} />
                                    {ROLEPLAY_COACH_NOTE_TYPE_LABELS[note.type]}
                                </Box>
                                <Text className={uiTokens.coachNotes.time}>
                                    {formatRoleplayCoachMessageTime(note.createdAt)}
                                </Text>
                                <Tooltip content="Supprimer cette note" className={uiTokens.coachNotes.deleteTooltip}>
                                    <Button
                                        aria-label="Supprimer cette note"
                                        className={uiTokens.coachNotes.deleteButton}
                                        onClick={() => onDelete(note.id)}
                                    >
                                        <InlineIcon icon={Trash2} className={uiTokens.coachNotes.deleteIcon} />
                                    </Button>
                                </Tooltip>
                            </Box>
                            <Text className={uiTokens.coachNotes.noteText}>{note.content}</Text>
                        </Box>
                    );
                })}
            </Box>

            <Box className={uiTokens.coachNotes.footer}>
                <Button
                    className={uiTokens.coachNotes.saveButton}
                    disabled={!canSave || isLoading || isSaving}
                    onClick={onSave}
                >
                    <InlineIcon icon={Save} className={uiTokens.coachNotes.actionIcon} />
                    {isSaving ? "Sauvegarde..." : `Sauvegarder les notes (${notes.length})`}
                </Button>
                <Text aria-live="polite" className={uiTokens.coachNotes.feedback}>{saveFeedback}</Text>
            </Box>
        </CardSurface>
    );
}
