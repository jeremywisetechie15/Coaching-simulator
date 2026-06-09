import type {
    PersonaEditorValues,
    PersonaListItem,
} from "@/features/personas/domain/persona-list";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";
import { getOpenAIRealtimeVoice, isOpenAIRealtimeVoiceId } from "@/lib/openai/realtime-voices";

export interface PersonaRow {
    avatar_url: string | null;
    company: string | null;
    created_at: string | null;
    id: string;
    name: string;
    role: string | null;
    system_instructions: string;
    voice_id: string | null;
}

export function mapPersonaRowToListItem(row: PersonaRow): PersonaListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url),
        company: row.company ?? "",
        id: row.id,
        name: row.name,
        role: row.role ?? "",
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}

export function mapPersonaRowToEditorValues(row: PersonaRow): PersonaEditorValues {
    const voiceId = row.voice_id && isOpenAIRealtimeVoiceId(row.voice_id) ? row.voice_id : "alloy";

    return {
        avatarUrl: row.avatar_url ?? "",
        company: row.company ?? "",
        name: row.name,
        role: row.role ?? "",
        systemInstructions: row.system_instructions,
        voiceId,
    };
}
