import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { UserSkillProgress } from "@/features/users/domain/users";
import { SkillDetailPageContent } from "./SkillDetailPageContent";

interface SkillDetailPageProps {
    profileValues: ProfileFormValues;
    progress: UserSkillProgress | null;
    skill: SkillDetail;
}

export function SkillDetailPage({ profileValues, progress, skill }: SkillDetailPageProps) {
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
            <SkillDetailPageContent
                canManage={canManageSkills}
                progress={progress}
                skill={skill}
            />
        </AppShell>
    );
}
