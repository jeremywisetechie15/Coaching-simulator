import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { SkillsPageContent } from "./SkillsPageContent";

interface SkillsPageProps {
    profileValues: ProfileFormValues;
}

export function SkillsPage({ profileValues }: SkillsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Compétences"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <SkillsPageContent />
        </AppShell>
    );
}
