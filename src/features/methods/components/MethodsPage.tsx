import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { MethodsPageContent } from "./MethodsPageContent";

interface MethodsPageProps {
    profileValues: ProfileFormValues;
}

export function MethodsPage({ profileValues }: MethodsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <MethodsPageContent />
        </AppShell>
    );
}
