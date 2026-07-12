import type { Evaluation, TranscriptMessage } from "@/features/roleplays/data/evaluation";

export const ROLEPLAY_COACH_MODE = {
    afterTraining: "after_training",
    beforeTraining: "before_training",
} as const;

export type RoleplayCoachMode = (typeof ROLEPLAY_COACH_MODE)[keyof typeof ROLEPLAY_COACH_MODE];

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

export interface RoleplayCoachTranscriptMessage {
    content: string;
    id: string;
    role: "assistant" | "user";
    timestamp: string;
}

export interface RoleplayCoachNote {
    content: string;
    createdAt: string;
    id: string;
    sourceMessageId: string | null;
    type: RoleplayCoachNoteType;
}

export const ROLEPLAY_COACH_TRANSCRIPT_EVENT = "maia:roleplay-coach-transcript-message";

export interface RoleplayCoachTranscriptEvent {
    coachSessionId: string;
    message: RoleplayCoachTranscriptMessage;
    scenarioId: string;
    type: typeof ROLEPLAY_COACH_TRANSCRIPT_EVENT;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isRoleplayCoachTranscriptEvent(value: unknown): value is RoleplayCoachTranscriptEvent {
    if (!isRecord(value) || value.type !== ROLEPLAY_COACH_TRANSCRIPT_EVENT) return false;
    if (typeof value.coachSessionId !== "string" || typeof value.scenarioId !== "string") return false;
    if (!isRecord(value.message)) return false;

    return (
        typeof value.message.id === "string" &&
        (value.message.role === "assistant" || value.message.role === "user") &&
        typeof value.message.content === "string" &&
        typeof value.message.timestamp === "string"
    );
}

export function formatRoleplayCoachMessageTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
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
