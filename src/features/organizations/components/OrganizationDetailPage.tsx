import { AppShell } from "@/features/app-shell/components";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { OrganizationDetailContent } from "./OrganizationDetailContent";

interface OrganizationDetailPageProps {
    initialIsEditing?: boolean;
    organization: OrganizationDetail;
    profileValues: ProfileFormValues;
}

export function OrganizationDetailPage({
    initialIsEditing = false,
    organization,
    profileValues,
}: OrganizationDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Organisations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
        >
            <OrganizationDetailContent initialIsEditing={initialIsEditing} organization={organization} />
        </AppShell>
    );
}
