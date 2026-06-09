import { notFound, redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { UserDetailPage } from "@/features/users/components";
import { getUserById } from "@/features/users/server";
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
    let user;

    try {
        profile = await getCurrentProfile();
        user = await getUserById(userId);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/users/${userId}`);
        }

        if (error instanceof ForbiddenError) {
            notFound();
        }

        throw error;
    }

    if (!user) {
        notFound();
    }

    const profileValues = toProfileFormValues(profile);

    return (
        <UserDetailPage
            avatarUrl={profileValues.avatarUrl}
            initialMode={resolvedSearchParams?.mode === "edit" ? "edit" : "view"}
            initials={getProfileInitials(profileValues)}
            user={user}
        />
    );
}
