import { AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplayCoachNoteGroup } from "@/features/roleplays/domain";
import { RoleplayDetailPageContent } from "./RoleplayDetailPageContent";

interface RoleplayDetailPageProps {
    noteGroups: RoleplayCoachNoteGroup[];
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
}

export function RoleplayDetailPage({ noteGroups, profileValues, roleplay }: RoleplayDetailPageProps) {
    const canManageRoleplays = canManageAppResource(
        profileValues.platformRole,
        APP_NAVIGATION_RESOURCE.roleplays,
    );

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
            <RoleplayDetailPageContent
                canManage={canManageRoleplays}
                noteGroups={noteGroups}
                roleplay={roleplay}
            />
        </AppShell>
    );
}
