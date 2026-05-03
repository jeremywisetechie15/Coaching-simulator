import { notFound, redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/server/errors";
import { UserDetailPage } from "@/features/users/components";
import { getDemoUserById } from "@/features/users/domain/users";
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
    const user = getDemoUserById(userId);

    if (!user) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/users/${userId}`);
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
