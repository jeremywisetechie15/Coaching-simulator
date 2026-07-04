import { AppShell } from "@/features/app-shell/components";
import { APP_NAVIGATION_RESOURCE, canManageAppResource } from "@/features/auth/domain/access-control";
import type { MethodListItem } from "@/features/methods/domain/method";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { MethodsPageContent } from "./MethodsPageContent";

interface MethodsPageProps {
    methods: MethodListItem[];
    profileValues: ProfileFormValues;
}

export function MethodsPage({ methods, profileValues }: MethodsPageProps) {
    const canManageMethods = canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.methods);

    return (
        <AppShell
            activePrimaryItem="Méthodes et Playbook"
            avatarUrl={profileValues.avatarUrl}
            platformRole={profileValues.platformRole}
            initials={getProfileInitials(profileValues)}
            fullName={`${profileValues.firstName} ${profileValues.lastName}`.trim()}
            email={profileValues.email}
            searchPlaceholder="Rechercher..."
        >
            <MethodsPageContent canManage={canManageMethods} methods={methods} />
        </AppShell>
    );
}
