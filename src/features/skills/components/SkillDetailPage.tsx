import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { SkillDetailPageContent } from "./SkillDetailPageContent";

interface SkillDetailPageProps {
    profileValues: ProfileFormValues;
    skill: SkillDetail;
}

export function SkillDetailPage({ profileValues, skill }: SkillDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Compétences"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SkillDetailPageContent skill={skill} />
        </AppShell>
    );
}
