import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type {
    RoleplayCoachOption,
    RoleplayEditorDetail,
    RoleplayGroupOption,
    RoleplayMethodOption,
    RoleplayOrganizationOption,
    RoleplayPersonaOption,
    RoleplayQuizOption,
    RoleplayScorecardOption,
    RoleplayUserOption,
} from "@/features/roleplays/domain";
import { CreateRoleplayPageContent } from "./CreateRoleplayPageContent";

interface CreateRoleplayPageProps {
    coachOptions: RoleplayCoachOption[];
    groupOptions: RoleplayGroupOption[];
    initialRoleplay?: RoleplayEditorDetail;
    methodOptions: RoleplayMethodOption[];
    organizationOptions: RoleplayOrganizationOption[];
    personaOptions: RoleplayPersonaOption[];
    profileValues: ProfileFormValues;
    quizOptions: RoleplayQuizOption[];
    roleplayId?: string;
    scorecardOptions: RoleplayScorecardOption[];
    userOptions: RoleplayUserOption[];
}

export function CreateRoleplayPage({
    coachOptions,
    groupOptions,
    initialRoleplay,
    methodOptions,
    organizationOptions,
    personaOptions,
    profileValues,
    quizOptions,
    roleplayId,
    scorecardOptions,
    userOptions,
}: CreateRoleplayPageProps) {
    const canManageRoleplays = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.roleplays);

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
            {canManageRoleplays ? (
                <CreateRoleplayPageContent
                    coachOptions={coachOptions}
                    groupOptions={groupOptions}
                    initialRoleplay={initialRoleplay}
                    methodOptions={methodOptions}
                    organizationOptions={organizationOptions}
                    personaOptions={personaOptions}
                    quizOptions={quizOptions}
                    roleplayId={roleplayId}
                    scorecardOptions={scorecardOptions}
                    userOptions={userOptions}
                />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
