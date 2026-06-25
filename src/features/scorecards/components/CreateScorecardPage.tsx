import { AppShell } from "@/features/app-shell/components";
import type { ScorecardMethodOption, ScorecardOrganizationOption } from "@/features/scorecards/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CreateScorecardPageContent } from "./CreateScorecardPageContent";

interface CreateScorecardPageProps {
    methodOptions: ScorecardMethodOption[];
    organizationOptions: ScorecardOrganizationOption[];
    profileValues: ProfileFormValues;
    skillOptions: SkillOption[];
}

export function CreateScorecardPage({
    methodOptions,
    organizationOptions,
    profileValues,
    skillOptions,
}: CreateScorecardPageProps) {
    return (
        <AppShell
            activePrimaryItem="Scorecards"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateScorecardPageContent
                methodOptions={methodOptions}
                organizationOptions={organizationOptions}
                skillOptions={skillOptions}
            />
        </AppShell>
    );
}
