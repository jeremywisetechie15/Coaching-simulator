import { AppShell } from "@/features/app-shell/components";
import type { Method } from "@/features/methods/data/methods";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { StepCoachVariant } from "./RoleplayStepCoachPageContent";
import { RoleplayStepsPageContent } from "./RoleplayStepsPageContent";

interface RoleplayStepsPageProps {
    method: Method;
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
    variant?: StepCoachVariant;
}

export function RoleplayStepsPage({ profileValues, roleplay, method, variant }: RoleplayStepsPageProps) {
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
            <RoleplayStepsPageContent roleplay={roleplay} method={method} variant={variant} />
        </AppShell>
    );
}
