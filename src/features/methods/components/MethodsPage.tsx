import { AppShell } from "@/features/app-shell/components";
import type { MethodListItem } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { MethodsPageContent } from "./MethodsPageContent";

interface MethodsPageProps {
    methods: MethodListItem[];
    profileValues: ProfileFormValues;
}

export function MethodsPage({ methods, profileValues }: MethodsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <MethodsPageContent methods={methods} />
        </AppShell>
    );
}
