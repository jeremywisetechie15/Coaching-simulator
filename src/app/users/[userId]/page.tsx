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
    listUserAssignedQuizzes,
    listUserAssignedRoleplays,
    listUserSkillProgresses,
    listUserStatistics,
} from "@/features/users/server";
import type { UserAssignedQuiz, UserAssignedRoleplay, UserSkillProgress, UserStatistics } from "@/features/users/domain/users";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Fiche utilisateur | MaiaCoach",
};

interface PageProps {
    params: Promise<{
        userId: string;
    }>;
    searchParams?: Promise<{
        mode?: string;
    }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { userId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;

    let profile;
    let assignedQuizzes: UserAssignedQuiz[] = [];
    let assignedRoleplays: UserAssignedRoleplay[] = [];
    let skills: UserSkillProgress[] = [];
    let statistics: UserStatistics;
    let user;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/users/${userId}`);
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

    [assignedRoleplays, assignedQuizzes] = await Promise.all([
        listUserAssignedRoleplays(user.id),
        listUserAssignedQuizzes(user.id),
    ]);
    [statistics, skills] = await Promise.all([
        listUserStatistics(user.id, {
            assignedQuizzes,
            assignedRoleplays,
        }),
        listUserSkillProgresses(user.id),
    ]);

    return (
        <UserDetailPage
            assignedQuizzes={assignedQuizzes}
            assignedRoleplays={assignedRoleplays}
            avatarUrl={profileValues.avatarUrl}
            initialMode={resolvedSearchParams?.mode === "edit" ? "edit" : "view"}
            initials={getProfileInitials(profileValues)}
            platformRole={profileValues.platformRole}
            skills={skills}
            statistics={statistics}
            user={user}
        />
    );
}
