import { AppShell } from "@/features/app-shell/components";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { PersonasPageContent } from "./PersonasPageContent";

interface PersonasPageProps {
    initialPersonas: PersonaListItem[];
    profileValues: ProfileFormValues;
}

export function PersonasPage({ initialPersonas, profileValues }: PersonasPageProps) {
    return (
        <AppShell
            activePrimaryItem="Mes Personas IA"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
        >
            <PersonasPageContent initialPersonas={initialPersonas} />
        </AppShell>
    );
}
