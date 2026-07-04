import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type {
    ScorecardDetail,
    ScorecardMethodOption,
    ScorecardOrganizationOption,
} from "@/features/scorecards/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CreateScorecardPageContent } from "./CreateScorecardPageContent";

interface CreateScorecardPageProps {
    initialScorecard?: ScorecardDetail;
    methodOptions: ScorecardMethodOption[];
    organizationOptions: ScorecardOrganizationOption[];
    profileValues: ProfileFormValues;
    scorecardId?: string;
    skillOptions: SkillOption[];
}

export function CreateScorecardPage({
    initialScorecard,
    methodOptions,
    organizationOptions,
    profileValues,
    scorecardId,
    skillOptions,
}: CreateScorecardPageProps) {
    const canManageScorecards = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.scorecards);

    return (
        <AppShell
            activePrimaryItem="Scorecards"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            {canManageScorecards ? (
                <CreateScorecardPageContent
                    initialScorecard={initialScorecard}
                    methodOptions={methodOptions}
                    organizationOptions={organizationOptions}
                    scorecardId={scorecardId}
                    skillOptions={skillOptions}
                />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
