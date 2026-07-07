import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplaySessionPageContent } from "./RoleplaySessionPageContent";

interface RoleplaySessionPageProps {
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
}

export function RoleplaySessionPage({ profileValues, roleplay }: RoleplaySessionPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplaySessionPageContent roleplay={roleplay} />
        </AppShell>
    );
}
