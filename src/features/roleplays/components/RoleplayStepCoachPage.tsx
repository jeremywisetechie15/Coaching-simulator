import { AppShell } from "@/features/app-shell/components";
import type { Method, MethodStep } from "@/features/methods/data/methods";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplayStepCoachPageContent, type StepCoachVariant } from "./RoleplayStepCoachPageContent";

interface RoleplayStepCoachPageProps {
    coachSessionId: string;
    method: Method;
    profileValues: ProfileFormValues;
    referenceSessionId?: string;
    roleplay: RoleplayItem;
    step: MethodStep;
    stepNumber: number;
    variant?: StepCoachVariant;
}

export function RoleplayStepCoachPage({
    coachSessionId,
    profileValues,
    roleplay,
    method,
    referenceSessionId,
    step,
    stepNumber,
    variant,
}: RoleplayStepCoachPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplayStepCoachPageContent
                coachSessionId={coachSessionId}
                roleplay={roleplay}
                method={method}
                referenceSessionId={referenceSessionId}
                step={step}
                stepNumber={stepNumber}
                variant={variant}
            />
        </AppShell>
    );
}
