import { AppShell } from "@/features/app-shell/components/AppShell";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { AccessDeniedState } from "./AccessDeniedState";

interface AccessDeniedPageProps {
    activeAccountItem?: string;
    activePrimaryItem?: string;
    description?: string;
    profileValues: ProfileFormValues;
    searchPlaceholder?: string;
}

export function AccessDeniedPage({
    activeAccountItem,
    activePrimaryItem,
    description,
    profileValues,
    searchPlaceholder,
}: AccessDeniedPageProps) {
    return (
        <AppShell
            activeAccountItem={activeAccountItem}
            activePrimaryItem={activePrimaryItem}
            avatarUrl={profileValues.avatarUrl}
            email={profileValues.email}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            initials={getProfileInitials(profileValues)}
            platformRole={profileValues.platformRole}
            searchPlaceholder={searchPlaceholder}
        >
            <AccessDeniedState description={description} />
        </AppShell>
    );
}
