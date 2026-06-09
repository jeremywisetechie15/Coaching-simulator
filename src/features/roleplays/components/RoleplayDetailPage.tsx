import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplayDetailPageContent } from "./RoleplayDetailPageContent";

interface RoleplayDetailPageProps {
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
}

export function RoleplayDetailPage({ profileValues, roleplay }: RoleplayDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplayDetailPageContent roleplay={roleplay} />
        </AppShell>
    );
}
