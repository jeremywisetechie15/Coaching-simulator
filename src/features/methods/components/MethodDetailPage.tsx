import { AppShell } from "@/features/app-shell/components";
import type { MethodDetail } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { MethodDetailPageContent } from "./MethodDetailPageContent";

interface MethodDetailPageProps {
    profileValues: ProfileFormValues;
    method: MethodDetail;
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
