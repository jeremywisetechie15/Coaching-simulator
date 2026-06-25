import { AppShell } from "@/features/app-shell/components";
import type { QuizListItem } from "@/features/evaluations/domain";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { EvaluationsPageContent } from "./EvaluationsPageContent";

interface EvaluationsPageProps {
    profileValues: ProfileFormValues;
    quizzes: QuizListItem[];
}

export function EvaluationsPage({ profileValues, quizzes }: EvaluationsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationsPageContent quizzes={quizzes} />
        </AppShell>
    );
}
