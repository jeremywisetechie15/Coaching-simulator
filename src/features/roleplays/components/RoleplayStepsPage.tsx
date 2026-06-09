import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { Method } from "@/features/methods/data/methods";
import { RoleplayStepsPageContent } from "./RoleplayStepsPageContent";

interface RoleplayStepsPageProps {
    profileValues: ProfileFormValues;
    roleplay: RoleplayItem;
    method: Method;
}

export function RoleplayStepsPage({ profileValues, roleplay, method }: RoleplayStepsPageProps) {
    return (
        <AppShell
            activePrimaryItem="Roleplays"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <RoleplayStepsPageContent roleplay={roleplay} method={method} />
        </AppShell>
    );
}
