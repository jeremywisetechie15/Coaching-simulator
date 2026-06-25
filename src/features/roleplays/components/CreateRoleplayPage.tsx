import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type {
    RoleplayCoachOption,
    RoleplayDetail,
    RoleplayGroupOption,
    RoleplayMethodOption,
    RoleplayOrganizationOption,
    RoleplayPersonaOption,
    RoleplayQuizOption,
    RoleplayScorecardOption,
    RoleplaySkillOption,
    RoleplayUserOption,
} from "@/features/roleplays/domain";
import { CreateRoleplayPageContent } from "./CreateRoleplayPageContent";

interface CreateRoleplayPageProps {
    coachOptions: RoleplayCoachOption[];
    groupOptions: RoleplayGroupOption[];
    initialRoleplay?: RoleplayDetail;
    methodOptions: RoleplayMethodOption[];
    organizationOptions: RoleplayOrganizationOption[];
    personaOptions: RoleplayPersonaOption[];
    profileValues: ProfileFormValues;
    quizOptions: RoleplayQuizOption[];
    roleplayId?: string;
    scorecardOptions: RoleplayScorecardOption[];
    skillOptions: RoleplaySkillOption[];
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
    skillOptions,
    userOptions,
}: CreateRoleplayPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
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
                skillOptions={skillOptions}
                userOptions={userOptions}
            />
        </AppShell>
    );
}
