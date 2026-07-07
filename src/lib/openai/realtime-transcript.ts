type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extractContentText(content: unknown): string[] {
    if (!isRecord(content)) return [];

    return [
        cleanText(content.transcript),
        cleanText(content.text),
        isRecord(content.audio) ? cleanText(content.audio.transcript) : null,
    ].filter((value): value is string => Boolean(value));
}

export function extractRealtimeAssistantTranscript(event: unknown): string | null {
    if (!isRecord(event)) return null;

    const directTranscript = cleanText(event.transcript);
    if (directTranscript) return directTranscript;

    const response = isRecord(event.response) ? event.response : null;
    const output = Array.isArray(response?.output) ? response.output : [];
    const transcripts = output.flatMap((item) => {
        if (!isRecord(item)) return [];
        if (item.role !== "assistant") return [];

        const content = Array.isArray(item.content) ? item.content : [];
        return content.flatMap(extractContentText);
    });

    return transcripts.length > 0 ? transcripts.join("\n").trim() : null;
}
