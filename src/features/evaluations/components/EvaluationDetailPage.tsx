import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { Evaluation } from "@/features/evaluations/data/evaluations";
import { EvaluationDetailPageContent } from "./EvaluationDetailPageContent";

interface EvaluationDetailPageProps {
    profileValues: ProfileFormValues;
    evaluation: Evaluation;
}

export function EvaluationDetailPage({ profileValues, evaluation }: EvaluationDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Évaluations"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <EvaluationDetailPageContent evaluation={evaluation} />
        </AppShell>
    );
}
