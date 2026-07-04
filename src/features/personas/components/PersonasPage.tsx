import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { PersonasPageContent } from "./PersonasPageContent";

interface PersonasPageProps {
    initialPersonas: PersonaListItem[];
    profileValues: ProfileFormValues;
}

export function PersonasPage({ initialPersonas, profileValues }: PersonasPageProps) {
    const canManagePersonas = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.personas);

    return (
        <AppShell
            activePrimaryItem="Mes Personas IA"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
        >
            <PersonasPageContent canManage={canManagePersonas} initialPersonas={initialPersonas} />
        </AppShell>
    );
}
