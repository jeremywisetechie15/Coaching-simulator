import type { TranscriptMessage } from "@/features/roleplays/data/evaluation";

export const ROLEPLAY_LIVE_TRANSCRIPT_EVENT = "maia:roleplay-live-transcript-message";

export interface RoleplayLiveTranscriptMessage {
    content: string;
    id: string;
    role: "assistant" | "user";
    timestamp: string;
}

export interface RoleplayLiveTranscriptEvent {
    message: RoleplayLiveTranscriptMessage;
    scenarioId: string;
    transcriptSessionId: string;
    type: typeof ROLEPLAY_LIVE_TRANSCRIPT_EVENT;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isRoleplayLiveTranscriptEvent(value: unknown): value is RoleplayLiveTranscriptEvent {
    if (!isRecord(value) || value.type !== ROLEPLAY_LIVE_TRANSCRIPT_EVENT) return false;
    if (typeof value.scenarioId !== "string" || typeof value.transcriptSessionId !== "string") return false;
    if (!isRecord(value.message)) return false;

    return (
        typeof value.message.id === "string" &&
        (value.message.role === "assistant" || value.message.role === "user") &&
        typeof value.message.content === "string" &&
        typeof value.message.timestamp === "string"
    );
}

export function isMatchingRoleplayLiveTranscriptEvent(
    value: unknown,
    target: Pick<RoleplayLiveTranscriptEvent, "scenarioId" | "transcriptSessionId">,
): value is RoleplayLiveTranscriptEvent {
    return (
        isRoleplayLiveTranscriptEvent(value) &&
        value.scenarioId === target.scenarioId &&
        value.transcriptSessionId === target.transcriptSessionId
    );
}

export function appendRoleplayLiveTranscriptMessage(
    messages: RoleplayLiveTranscriptMessage[],
    message: RoleplayLiveTranscriptMessage,
) {
    if (messages.some((current) => current.id === message.id)) return messages;
    return [...messages, message];
}

export function formatRoleplayLiveTranscriptMessageTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
    }).format(date);
}

export function toRoleplayTranscriptMessages(
    messages: RoleplayLiveTranscriptMessage[],
): TranscriptMessage[] {
    return messages.map((message) => ({
        id: message.id,
        speaker: message.role === "assistant" ? "persona" : "you",
        text: message.content,
        time: formatRoleplayLiveTranscriptMessageTime(message.timestamp),
    }));
}
