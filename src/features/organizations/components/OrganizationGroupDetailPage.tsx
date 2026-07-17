import { AppShell } from "@/features/app-shell/components";
import type { OrganizationGroupPageData } from "@/features/organizations/server";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { OrganizationGroupDetailContent } from "./OrganizationGroupDetailContent";

interface OrganizationGroupDetailPageProps {
    groupData: OrganizationGroupPageData;
    initialIsEditing?: boolean;
    profileValues: ProfileFormValues;
}

export function OrganizationGroupDetailPage({
    groupData,
    initialIsEditing = false,
    profileValues,
}: OrganizationGroupDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Organisations"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
        >
            <OrganizationGroupDetailContent
                evaluations={groupData.evaluations}
                group={groupData.group}
                initialIsEditing={initialIsEditing}
                members={groupData.members}
                roleplays={groupData.roleplays}
            />
        </AppShell>
    );
}
