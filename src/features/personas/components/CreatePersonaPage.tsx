import { AppShell } from "@/features/app-shell/components";
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
    return (
        <AppShell
            activePrimaryItem="Mes Personas IA"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreatePersonaPageContent initialValues={initialValues} personaId={personaId} />
        </AppShell>
    );
}
