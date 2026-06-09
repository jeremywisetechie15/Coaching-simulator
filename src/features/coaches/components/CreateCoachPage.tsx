import { AppShell } from "@/features/app-shell/components";
import type { CoachEditorValues } from "@/features/coaches/domain/coach-list";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateCoachPageContent } from "./CreateCoachPageContent";

interface CreateCoachPageProps {
    coachId?: string;
    initialValues?: CoachEditorValues;
    profileValues: ProfileFormValues;
}

export function CreateCoachPage({ coachId, initialValues, profileValues }: CreateCoachPageProps) {
    return (
        <AppShell
            activePrimaryItem="Mes Coachs IA"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateCoachPageContent coachId={coachId} initialValues={initialValues} />
        </AppShell>
    );
}
