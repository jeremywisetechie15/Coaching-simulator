import type { PropsWithChildren } from "react";
import { AppShell } from "@/features/app-shell/components";
import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";

interface ProfileLayoutProps extends PropsWithChildren {
    profileValues: ProfileFormValues;
}

export function ProfileLayout({ children, profileValues }: ProfileLayoutProps) {
    return (
        <AppShell
            activeAccountItem="Mon profil"
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
        >
            {children}
        </AppShell>
    );
}
