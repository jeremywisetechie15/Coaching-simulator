import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateQuizPageContent } from "./CreateQuizPageContent";

interface CreateQuizPageProps {
    profileValues: ProfileFormValues;
}

export function CreateQuizPage({ profileValues }: CreateQuizPageProps) {
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateQuizPageContent />
        </AppShell>
    );
}
