import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplayCoachNoteGroup } from "@/features/roleplays/domain";
import { RoleplaySessionPageContent } from "./RoleplaySessionPageContent";

interface RoleplaySessionPageProps {
    noteGroups: RoleplayCoachNoteGroup[];
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
}

export function RoleplaySessionPage({ noteGroups, profileValues, roleplay }: RoleplaySessionPageProps) {
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
            <RoleplaySessionPageContent noteGroups={noteGroups} roleplay={roleplay} />
        </AppShell>
    );
}
