import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { RoleplaysPageContent } from "./RoleplaysPageContent";

interface RoleplaysPageProps {
    profileValues: ProfileFormValues;
}

export function RoleplaysPage({ profileValues }: RoleplaysPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplaysPageContent />
        </AppShell>
    );
}
