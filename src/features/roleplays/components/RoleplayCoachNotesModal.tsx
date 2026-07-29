"use client";

import { CalendarDays } from "lucide-react";
import {
    ROLEPLAY_COACH_MODE_LABELS,
    ROLEPLAY_COACH_NOTE_TYPE_LABELS,
    countRoleplayCoachNotes,
    formatRoleplayCoachNotesSavedAt,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RoleplayCoachNotesModalProps {
    groups: RoleplayCoachNoteGroup[];
    onClose: () => void;
    title: string;
}

export function RoleplayCoachNotesModal({
    groups,
    onClose,
    title,
}: RoleplayCoachNotesModalProps) {
    const noteCount = countRoleplayCoachNotes(groups);
    const isPlural = noteCount !== 1;

    return (
        <Modal
            className="max-w-[680px]"
            description={`${noteCount} note${isPlural ? "s" : ""} enregistrée${isPlural ? "s" : ""}`}
            onClose={onClose}
            title={title}
        >
            <Box className={uiTokens.coachNotes.viewer.list}>
                {groups.length === 0 ? (
                    <Text className={uiTokens.coachNotes.viewer.empty}>
                        Aucune note enregistrée pour le moment.
                    </Text>
                ) : groups.map((group) => (
                    <Box key={`${group.methodStepId ?? group.stepOrder}-${group.coachMode}`} className={uiTokens.coachNotes.viewer.group}>
                        <Box className={uiTokens.coachNotes.viewer.groupHeader}>
                            <Box className={uiTokens.coachNotes.viewer.groupIcon}>
                                <InlineIcon icon={CalendarDays} className={uiTokens.coachNotes.viewer.groupIconSvg} />
                            </Box>
                            <Box className="min-w-0 flex-1">
                                <Text className={uiTokens.coachNotes.viewer.groupTitle}>
                                    Étape {group.stepOrder} · {group.stepTitle}
                                </Text>
                                <Text className={uiTokens.coachNotes.viewer.groupMeta}>
                                    {ROLEPLAY_COACH_MODE_LABELS[group.coachMode]} · Enregistré le{" "}
                                    {formatRoleplayCoachNotesSavedAt(group.savedAt)} · {group.notes.length} note
                                    {group.notes.length > 1 ? "s" : ""}
                                </Text>
                            </Box>
                        </Box>

                        <Box className={uiTokens.coachNotes.viewer.notes}>
                            {group.notes.map((note) => {
                                const tone = uiTokens.coachNotes.typeTone[note.type];

                                return (
                                    <Box key={note.id} className={cn(uiTokens.coachNotes.viewer.note, tone.surface)}>
                                        <Box className={cn(uiTokens.coachNotes.typeBadge, tone.badge)}>
                                            {ROLEPLAY_COACH_NOTE_TYPE_LABELS[note.type]}
                                        </Box>
                                        <Text className={uiTokens.coachNotes.viewer.noteText}>
                                            {note.content}
                                        </Text>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Modal>
    );
}
