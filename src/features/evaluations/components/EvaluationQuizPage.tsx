import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { Evaluation } from "@/features/evaluations/data/evaluations";
import { EvaluationQuizPageContent } from "./EvaluationQuizPageContent";

interface EvaluationQuizPageProps {
    profileValues: ProfileFormValues;
    evaluation: Evaluation;
}

export function EvaluationQuizPage({ profileValues, evaluation }: EvaluationQuizPageProps) {
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationQuizPageContent evaluation={evaluation} />
        </AppShell>
    );
}
