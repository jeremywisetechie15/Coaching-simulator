import { AppShell } from "@/features/app-shell/components";
import type { QuizOption } from "@/features/evaluations/domain";
import type { MethodDetail, MethodOrganizationOption } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { CreateMethodPageContent } from "./CreateMethodPageContent";

interface CreateMethodPageProps {
    method?: MethodDetail;
    organizationOptions: MethodOrganizationOption[];
    profileValues: ProfileFormValues;
    quizOptions: QuizOption[];
}

export function CreateMethodPage({ method, organizationOptions, profileValues, quizOptions }: CreateMethodPageProps) {
    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <CreateMethodPageContent
                initialMethod={method}
                organizationOptions={organizationOptions}
                quizOptions={quizOptions}
            />
        </AppShell>
    );
}
