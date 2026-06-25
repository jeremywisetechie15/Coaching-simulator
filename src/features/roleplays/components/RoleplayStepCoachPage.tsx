import { AppShell } from "@/features/app-shell/components";
import type { Method, MethodStep } from "@/features/methods/data/methods";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { RoleplayStepCoachPageContent } from "./RoleplayStepCoachPageContent";

interface RoleplayStepCoachPageProps {
    method: Method;
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
    step: MethodStep;
    stepNumber: number;
}

export function RoleplayStepCoachPage({
    profileValues,
    roleplay,
    method,
    step,
    stepNumber,
}: RoleplayStepCoachPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplayStepCoachPageContent
                roleplay={roleplay}
                method={method}
                step={step}
                stepNumber={stepNumber}
            />
        </AppShell>
    );
}
