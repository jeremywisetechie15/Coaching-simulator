import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateSkillPageContent } from "./CreateSkillPageContent";

interface CreateSkillPageProps {
    profileValues: ProfileFormValues;
}

export function CreateSkillPage({ profileValues }: CreateSkillPageProps) {
    return (
        <AppShell
            activePrimaryItem="Compétences"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateSkillPageContent />
        </AppShell>
    );
}
