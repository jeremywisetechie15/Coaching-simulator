import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { OrganizationsPageContent } from "./OrganizationsPageContent";

interface OrganizationsPageProps {
    accessDenied?: boolean;
    initialCreateOpen?: boolean;
    initialOrganizations: OrganizationListItem[];
    profileValues: ProfileFormValues;
}

export function OrganizationsPage({
    accessDenied = false,
    initialCreateOpen = false,
    initialOrganizations,
    profileValues,
}: OrganizationsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Organisations"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
        >
            {accessDenied ? (
                <AccessDeniedState />
            ) : (
                <OrganizationsPageContent
                    initialCreateOpen={initialCreateOpen}
                    initialOrganizations={initialOrganizations}
                />
            )}
        </AppShell>
    );
}
