import { APP_TIME_ZONE } from "@/lib/date/format-date-time";

export interface RoleplayNotationMessage {
    content: string | null;
    id?: string | null;
    role: string | null;
    timestamp: string | null;
}

export interface RoleplayNotationTranscriptConversationItem {
    etape_methodo: number | null;
    id: number;
    is_ai_response: boolean;
    speaker: "Apprenant" | "Persona";
    timecode_absolute: string;
    timecode_relative: string;
    verbatim: string;
}

export interface RoleplayNotationTranscriptPayload {
    conversation: RoleplayNotationTranscriptConversationItem[];
    exclude_from_global_score: true;
    messages_apprenant: number;
    messages_persona: number;
    onglet: "Transcription";
    total_messages: number;
}

function toTimestamp(value: string | null) {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}

function formatAbsoluteTime(value: string | null) {
    const timestamp = toTimestamp(value);
    if (timestamp === null) return "";

    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
        timeZone: APP_TIME_ZONE,
    }).format(new Date(timestamp));
}

function formatDuration(milliseconds: number) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((part) => part.toString().padStart(2, "0"))
        .join(":");
}

function normalizeMessages(messages: RoleplayNotationMessage[]) {
    return messages
        .map((message) => ({ ...message, content: message.content?.trim() ?? "" }))
        .filter((message) => message.content.length > 0);
}

export function buildRoleplayNotationTranscript(
    messages: RoleplayNotationMessage[],
): RoleplayNotationTranscriptPayload {
    const normalizedMessages = normalizeMessages(messages);
    const firstTimestamp = normalizedMessages
        .map((message) => toTimestamp(message.timestamp))
        .find((timestamp): timestamp is number => timestamp !== null) ?? null;

    const conversation = normalizedMessages.map((message, index): RoleplayNotationTranscriptConversationItem => {
        const timestamp = toTimestamp(message.timestamp);
        const isLearner = message.role === "user";

        return {
            etape_methodo: null,
            id: index + 1,
            is_ai_response: !isLearner,
            speaker: isLearner ? "Apprenant" : "Persona",
            timecode_absolute: formatAbsoluteTime(message.timestamp),
            timecode_relative:
                timestamp !== null && firstTimestamp !== null
                    ? formatDuration(timestamp - firstTimestamp)
                    : "",
            verbatim: message.content,
        };
    });

    return {
        conversation,
        exclude_from_global_score: true,
        messages_apprenant: conversation.filter((message) => message.speaker === "Apprenant").length,
        messages_persona: conversation.filter((message) => message.speaker === "Persona").length,
        onglet: "Transcription",
        total_messages: conversation.length,
    };
}

export function buildRoleplayNotationTranscriptText(
    transcript: RoleplayNotationTranscriptPayload,
) {
    return transcript.conversation
        .map((message) => {
            const speaker = message.speaker === "Apprenant" ? "Utilisateur" : "Persona";
            return `[M${message.id}] [${message.timecode_absolute || "--:--:--"}] ${speaker}: ${message.verbatim}`;
        })
        .join("\n");
}
