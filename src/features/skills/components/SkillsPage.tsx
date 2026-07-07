import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillListItem } from "@/features/skills/domain/skills";
import { SkillsPageContent } from "./SkillsPageContent";

interface SkillsPageProps {
    profileValues: ProfileFormValues;
    skills: SkillListItem[];
}

export function SkillsPage({ profileValues, skills }: SkillsPageProps) {
    const canManageSkills = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.skills);

    return (
        <AppShell
            activePrimaryItem="Compétences"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SkillsPageContent canManage={canManageSkills} skills={skills} />
        </AppShell>
    );
}
