import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";

export interface PersonaRow {
    avatar_url: string | null;
    company: string | null;
    created_at: string | null;
    id: string;
    name: string;
    role: string | null;
}

function getInfluenceLabel(row: PersonaRow): PersonaListItem["influenceLabel"] {
    const seed = `${row.id}${row.name}`.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

    return seed % 3 === 0 ? "Influent" : "Stable";
}

export function mapPersonaRowToListItem(row: PersonaRow): PersonaListItem {
    return {
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url),
        company: row.company ?? "",
        id: row.id,
        influenceLabel: getInfluenceLabel(row),
        name: row.name,
        role: row.role ?? "",
    };
}
