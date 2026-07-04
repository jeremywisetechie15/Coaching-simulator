import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { PersonaEditorValues } from "@/features/personas/domain/persona-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreatePersonaPageContent } from "./CreatePersonaPageContent";

interface CreatePersonaPageProps {
    initialValues?: PersonaEditorValues;
    personaId?: string;
    profileValues: ProfileFormValues;
}

export function CreatePersonaPage({ initialValues, personaId, profileValues }: CreatePersonaPageProps) {
    const canManagePersonas = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.personas);

    return (
        <AppShell
            activePrimaryItem="Mes Personas IA"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            {canManagePersonas ? (
                <CreatePersonaPageContent initialValues={initialValues} personaId={personaId} />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
