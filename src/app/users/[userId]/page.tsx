import { notFound, redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { UserDetailPage } from "@/features/users/components";
import {
    getUserById,
    listUserAiInteractions,
    listUserAssignedQuizzes,
    listUserAssignedRoleplays,
    listUserSkillProgresses,
} from "@/features/users/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";
import { buildAuthRedirectHref, withReturnTo, withSearchParam } from "@/features/app-shell/domain";
import { listUserPendingOrganizationInvitations } from "@/features/organizations/server";

export const metadata = {
    title: "Fiche utilisateur | MaiaCoach",
};

interface PageProps {
    params: Promise<{
        userId: string;
    }>;
    searchParams?: Promise<{
        mode?: string;
        returnTo?: string;
    }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { userId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;

    let profile;
    let user;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(
                buildAuthRedirectHref(
                    withReturnTo(
                        resolvedSearchParams?.mode === "edit"
                            ? withSearchParam(`/users/${userId}`, "mode", "edit")
                            : `/users/${userId}`,
                        resolvedSearchParams?.returnTo,
                    ),
                ),
            );
        }

        throw error;
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.users)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Utilisateurs"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    try {
        user = await getUserById(userId);
    } catch (error) {
        if (error instanceof ForbiddenError) {
            return (
                <AccessDeniedPage
                    activePrimaryItem="Utilisateurs"
                    profileValues={profileValues}
                    searchPlaceholder="Rechercher..."
                />
            );
        }

        throw error;
    }

    if (!user) {
        notFound();
    }

    const [
        assignedRoleplays,
        assignedQuizzes,
        invitationResendTargets,
        aiInteractions,
        skills,
    ] = await Promise.all([
        listUserAssignedRoleplays(user.id),
        listUserAssignedQuizzes(user.id),
        listUserPendingOrganizationInvitations(user.id),
        listUserAiInteractions(user.id),
        listUserSkillProgresses(user.id),
    ]);

    return (
        <UserDetailPage
            aiInteractions={aiInteractions}
            assignedQuizzes={assignedQuizzes}
            assignedRoleplays={assignedRoleplays}
            avatarUrl={profileValues.avatarUrl}
            initialMode={resolvedSearchParams?.mode === "edit" ? "edit" : "view"}
            initials={getProfileInitials(profileValues)}
            invitationResendTargets={invitationResendTargets}
            platformRole={profileValues.platformRole}
            skills={skills}
            user={user}
        />
    );
}
