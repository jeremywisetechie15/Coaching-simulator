import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import type { Method } from "@/features/methods/data/methods";
import { MethodDetailPageContent } from "./MethodDetailPageContent";

interface MethodDetailPageProps {
    profileValues: ProfileFormValues;
    method: Method;
}

export function MethodDetailPage({ profileValues, method }: MethodDetailPageProps) {
    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <MethodDetailPageContent method={method} />
        </AppShell>
    );
}
