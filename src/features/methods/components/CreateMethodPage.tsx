import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateMethodPageContent } from "./CreateMethodPageContent";

interface CreateMethodPageProps {
    profileValues: ProfileFormValues;
}

export function CreateMethodPage({ profileValues }: CreateMethodPageProps) {
    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateMethodPageContent />
        </AppShell>
    );
}
