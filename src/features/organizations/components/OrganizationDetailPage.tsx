import { AppShell } from "@/features/app-shell/components";
import type {
    OrganizationDetail,
    OrganizationEvaluationRow,
    OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import type { OrganizationRemovalAction } from "@/features/organizations/domain/organization-deletion";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { OrganizationDetailContent } from "./OrganizationDetailContent";

interface OrganizationDetailPageProps {
    initialIsEditing?: boolean;
    evaluations?: OrganizationEvaluationRow[];
    organization: OrganizationDetail;
    profileValues: ProfileFormValues;
    removalAction: OrganizationRemovalAction;
    roleplays?: OrganizationRoleplayRow[];
}

export function OrganizationDetailPage({
    initialIsEditing = false,
    evaluations = [],
    organization,
    profileValues,
    removalAction,
    roleplays = [],
}: OrganizationDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Organisations"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
        >
            <OrganizationDetailContent
                evaluations={evaluations}
                initialIsEditing={initialIsEditing}
                organization={organization}
                removalAction={removalAction}
                roleplays={roleplays}
            />
        </AppShell>
    );
}
