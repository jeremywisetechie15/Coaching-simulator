import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateRoleplayPageContent } from "./CreateRoleplayPageContent";

interface CreateRoleplayPageProps {
    profileValues: ProfileFormValues;
}

export function CreateRoleplayPage({ profileValues }: CreateRoleplayPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateRoleplayPageContent />
        </AppShell>
    );
}
