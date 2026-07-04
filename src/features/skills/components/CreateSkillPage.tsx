import { AccessDeniedState, AppShell } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import type {
    ContentTargetGroupOption,
    ContentTargetOrganizationOption,
    ContentTargetUserOption,
} from "@/features/content/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { CreateSkillPageContent } from "./CreateSkillPageContent";

interface CreateSkillPageProps {
    groupOptions: ContentTargetGroupOption[];
    initialSkill?: SkillDetail;
    organizationOptions: ContentTargetOrganizationOption[];
    profileValues: ProfileFormValues;
    userOptions: ContentTargetUserOption[];
}

export function CreateSkillPage({
    groupOptions,
    initialSkill,
    organizationOptions,
    profileValues,
    userOptions,
}: CreateSkillPageProps) {
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
            {canManageSkills ? (
                <CreateSkillPageContent
                    groupOptions={groupOptions}
                    initialSkill={initialSkill}
                    organizationOptions={organizationOptions}
                    userOptions={userOptions}
                />
            ) : (
                <AccessDeniedState />
            )}
        </AppShell>
    );
}
