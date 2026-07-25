import type { RoleplayNotationTranscriptConversationItem } from "./roleplay-notation-transcript";

type JsonRecord = Record<string, unknown>;

export interface RoleplayNotationTranscriptCorrection {
    message_ref: string;
    phrase_originale: string;
    pourquoi: string;
    verbatim_preconise: string;
}

export interface TranscriptHighlightSegment {
    highlighted: boolean;
    text: string;
}

export const ROLEPLAY_TRANSCRIPT_VERBATIM_LIMIT_PER_MESSAGE = 2;

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimmedString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function comparableText(value: string) {
    return value.trim().toLocaleLowerCase("fr-FR");
}

function lowercaseText(value: string) {
    return value.toLocaleLowerCase("fr-FR");
}

export function findTranscriptPhraseRange(message: string, phrase: string) {
    const trimmedPhrase = phrase.trim();
    if (!trimmedPhrase) return null;

    const start = lowercaseText(message).indexOf(lowercaseText(trimmedPhrase));
    if (start < 0) return null;

    return {
        end: start + trimmedPhrase.length,
        start,
    };
}

export function normalizeRoleplayTranscriptCorrection({
    correction,
    pointsAwarded,
    pointsMax,
    transcript,
}: {
    correction: unknown;
    pointsAwarded: number;
    pointsMax: number;
    transcript: readonly RoleplayNotationTranscriptConversationItem[];
}): RoleplayNotationTranscriptCorrection | null {
    if (
        !Number.isFinite(pointsAwarded)
        || !Number.isFinite(pointsMax)
        || pointsMax <= 0
        || pointsAwarded >= pointsMax
        || !isRecord(correction)
    ) {
        return null;
    }

    const messageRef = trimmedString(correction.message_ref);
    const original = trimmedString(correction.phrase_originale);
    const suggested = trimmedString(correction.verbatim_preconise);
    const reason = trimmedString(correction.pourquoi);
    const messageNumber = /^M([1-9]\d*)$/.exec(messageRef)?.[1];

    if (!messageNumber || !original || !suggested || !reason) {
        return null;
    }

    const message = transcript.find((item) => item.id === Number(messageNumber));
    if (
        !message
        || message.speaker !== "Apprenant"
        || !findTranscriptPhraseRange(message.verbatim, original)
        || comparableText(original) === comparableText(suggested)
    ) {
        return null;
    }

    return {
        message_ref: messageRef,
        phrase_originale: original,
        pourquoi: reason,
        verbatim_preconise: suggested,
    };
}

export function createRoleplayTranscriptCorrectionLimiter() {
    const suggestionsByMessage = new Map<string, Set<string>>();

    return (
        correction: RoleplayNotationTranscriptCorrection | null,
    ): RoleplayNotationTranscriptCorrection | null => {
        if (!correction) return null;

        const messageKey = correction.message_ref;
        const suggestionKey = comparableText(correction.verbatim_preconise);
        const acceptedSuggestions = suggestionsByMessage.get(messageKey) ?? new Set<string>();

        if (
            acceptedSuggestions.has(suggestionKey)
            || acceptedSuggestions.size >= ROLEPLAY_TRANSCRIPT_VERBATIM_LIMIT_PER_MESSAGE
        ) {
            return null;
        }

        acceptedSuggestions.add(suggestionKey);
        suggestionsByMessage.set(messageKey, acceptedSuggestions);
        return correction;
    };
}

export function buildTranscriptHighlightSegments(
    message: string,
    phrases: readonly string[],
): TranscriptHighlightSegment[] {
    const ranges = phrases
        .map((phrase) => findTranscriptPhraseRange(message, phrase))
        .filter((range): range is { end: number; start: number } => Boolean(range))
        .sort((first, second) => first.start - second.start || first.end - second.end);

    if (ranges.length === 0) {
        return [{ highlighted: false, text: message }];
    }

    const mergedRanges = ranges.reduce<Array<{ end: number; start: number }>>((merged, range) => {
        const previous = merged.at(-1);
        if (!previous || range.start > previous.end) {
            merged.push({ ...range });
        } else {
            previous.end = Math.max(previous.end, range.end);
        }
        return merged;
    }, []);

    const segments: TranscriptHighlightSegment[] = [];
    let cursor = 0;

    for (const range of mergedRanges) {
        if (range.start > cursor) {
            segments.push({ highlighted: false, text: message.slice(cursor, range.start) });
        }
        segments.push({ highlighted: true, text: message.slice(range.start, range.end) });
        cursor = range.end;
    }

    if (cursor < message.length) {
        segments.push({ highlighted: false, text: message.slice(cursor) });
    }

    return segments;
}
