import type { Evaluation, TranscriptMessage } from "@/features/roleplays/data/evaluation";
import { formatRoleplayLiveTranscriptMessageTime } from "./roleplay-live-transcript";

export const ROLEPLAY_COACH_MODE = {
    afterTraining: "after_training",
    beforeTraining: "before_training",
    feedback: "feedback",
    notation: "notation",
} as const;

export type RoleplayCoachMode = (typeof ROLEPLAY_COACH_MODE)[keyof typeof ROLEPLAY_COACH_MODE];

export const ROLEPLAY_COACH_MODES = Object.values(ROLEPLAY_COACH_MODE);

export const ROLEPLAY_COACH_MODE_LABELS: Record<RoleplayCoachMode, string> = {
    [ROLEPLAY_COACH_MODE.afterTraining]: "Après l'entraînement",
    [ROLEPLAY_COACH_MODE.beforeTraining]: "Préparation",
    [ROLEPLAY_COACH_MODE.feedback]: "Feedback",
    [ROLEPLAY_COACH_MODE.notation]: "Débrief",
};

export function isRoleplayCoachMode(value: unknown): value is RoleplayCoachMode {
    return typeof value === "string" && ROLEPLAY_COACH_MODES.includes(value as RoleplayCoachMode);
}

export const ROLEPLAY_COACH_PROMPT_TITLE = {
    afterTraining: "coach.after_training",
    beforeTraining: "coach.before_training",
    feedback: "coach.variant.feedback",
    global: "prompt.coach.global",
    notation: "coach.notation.synthese",
    personaFeedback: "persona.variant.feedback",
} as const;

export const ROLEPLAY_COACH_NOTE_TYPE = {
    example: "example",
    keyPoint: "key_point",
    suggestion: "suggestion",
} as const;

export type RoleplayCoachNoteType =
    (typeof ROLEPLAY_COACH_NOTE_TYPE)[keyof typeof ROLEPLAY_COACH_NOTE_TYPE];

export const ROLEPLAY_COACH_NOTE_TYPES = Object.values(ROLEPLAY_COACH_NOTE_TYPE);

export const ROLEPLAY_COACH_NOTE_TYPE_LABELS: Record<RoleplayCoachNoteType, string> = {
    [ROLEPLAY_COACH_NOTE_TYPE.example]: "Exemple",
    [ROLEPLAY_COACH_NOTE_TYPE.keyPoint]: "Point clé",
    [ROLEPLAY_COACH_NOTE_TYPE.suggestion]: "Suggestion",
};

export interface RoleplayCoachNote {
    content: string;
    createdAt: string;
    id: string;
    sourceMessageId: string | null;
    type: RoleplayCoachNoteType;
}

export interface RoleplayCoachNoteGroup {
    coachMode: RoleplayCoachMode;
    methodStepId: string | null;
    notes: RoleplayCoachNote[];
    savedAt: string;
    stepOrder: number;
    stepTitle: string;
}

export interface RoleplayCoachNoteStepEntry {
    group: RoleplayCoachNoteGroup;
    note: RoleplayCoachNote;
}

export interface RoleplayCoachNotesStepGroup {
    entries: RoleplayCoachNoteStepEntry[];
    savedAt: string;
    stepOrder: number;
    stepTitle: string;
}

export function countRoleplayCoachNotes(groups: RoleplayCoachNoteGroup[]) {
    return groups.reduce((total, group) => total + group.notes.length, 0);
}

export function groupRoleplayCoachNotesByStep(
    groups: RoleplayCoachNoteGroup[],
): RoleplayCoachNotesStepGroup[] {
    const groupedByStep = new Map<number, RoleplayCoachNotesStepGroup>();

    for (const group of groups) {
        const entries = group.notes.map((note) => ({ group, note }));
        const current = groupedByStep.get(group.stepOrder);

        if (!current) {
            groupedByStep.set(group.stepOrder, {
                entries,
                savedAt: group.savedAt,
                stepOrder: group.stepOrder,
                stepTitle: group.stepTitle,
            });
            continue;
        }

        current.entries.push(...entries);
        if (new Date(group.savedAt).getTime() > new Date(current.savedAt).getTime()) {
            current.savedAt = group.savedAt;
        }
    }

    return [...groupedByStep.values()].sort((left, right) => left.stepOrder - right.stepOrder);
}

export function updateRoleplayCoachNote(
    group: RoleplayCoachNoteGroup,
    noteId: string,
    updates: Pick<RoleplayCoachNote, "content" | "type">,
): RoleplayCoachNoteGroup {
    return {
        ...group,
        notes: group.notes.map((note) => note.id === noteId ? { ...note, ...updates } : note),
    };
}

export function replaceRoleplayCoachNoteGroup(
    groups: RoleplayCoachNoteGroup[],
    nextGroup: RoleplayCoachNoteGroup,
) {
    const hasMatchingGroup = groups.some(
        (group) => group.coachMode === nextGroup.coachMode && group.stepOrder === nextGroup.stepOrder,
    );

    if (!hasMatchingGroup) return [...groups, nextGroup];

    return groups.map((group) =>
        group.coachMode === nextGroup.coachMode && group.stepOrder === nextGroup.stepOrder
            ? nextGroup
            : group,
    );
}

export function formatRoleplayCoachMessageTime(value: string) {
    return formatRoleplayLiveTranscriptMessageTime(value);
}

export function formatRoleplayCoachNotesSavedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "long",
        timeZone: "Europe/Paris",
        year: "numeric",
    }).format(date);
}

export function buildRoleplayStepCoachReferenceTranscript(
    evaluation: Evaluation,
    stepNumber: number,
): TranscriptMessage[] {
    const stepTranscript = evaluation.steps.find((step) => step.number === stepNumber)?.stepTranscript;

    if (stepTranscript?.lines.length) {
        return stepTranscript.lines.map((line, index) => ({
            id: `evaluated-step-${stepNumber}-message-${index + 1}`,
            speaker: line.speaker,
            text: line.text,
            time:
                index === 0
                    ? stepTranscript.start
                    : index === stepTranscript.lines.length - 1
                      ? stepTranscript.end
                      : "",
        }));
    }

    return evaluation.transcript.map((message, index) => ({
        ...message,
        id: message.id ?? `evaluated-session-message-${index + 1}`,
    }));
}
