import type { CoachEditorValues, CoachListItem } from "@/features/coaches/domain/coach-list";
import { getOpenAIRealtimeVoice, isOpenAIRealtimeVoiceId } from "@/lib/openai/realtime-voices";

export interface CoachRow {
    avatar_url: string | null;
    created_at: string | null;
    id: string;
    name: string;
    system_instructions: string;
    voice_id: string | null;
}

function formatDate(value: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

export function mapCoachRowToListItem(row: CoachRow): CoachListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        avatarSrc: row.avatar_url,
        createdAt: formatDate(row.created_at),
        id: row.id,
        name: row.name,
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
        voiceRecommended: voice?.recommended ?? false,
    };
}

export function mapCoachRowToEditorValues(row: CoachRow): CoachEditorValues {
    const voiceId = row.voice_id && isOpenAIRealtimeVoiceId(row.voice_id) ? row.voice_id : "cedar";

    return {
        avatarSrc: row.avatar_url ?? "",
        name: row.name,
        systemInstructions: row.system_instructions,
        voiceId,
    };
}
