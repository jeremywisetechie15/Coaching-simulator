import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { SkillListItem } from "@/features/skills/domain/skills";
import { SkillsPageContent } from "./SkillsPageContent";

interface SkillsPageProps {
    profileValues: ProfileFormValues;
    skills: SkillListItem[];
}

export function SkillsPage({ profileValues, skills }: SkillsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Compétences"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SkillsPageContent skills={skills} />
        </AppShell>
    );
}
