import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateCoachPage } from "@/features/coaches/components";
import { getCoachById } from "@/features/coaches/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{
        coachId: string;
    }>;
}

export const metadata = {
    title: "Modifier un coach IA | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { coachId } = await params;
    let profile;
    let coach;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/coaches/${coachId}`);
        }

        throw error;
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.coaches)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Mes Coachs IA"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    try {
        coach = await getCoachById(coachId);
    } catch (error) {
        if (error instanceof ForbiddenError) {
            return (
                <AccessDeniedPage
                    activePrimaryItem="Mes Coachs IA"
                    profileValues={profileValues}
                    searchPlaceholder="Rechercher..."
                />
            );
        }

        throw error;
    }

    if (!coach) {
        notFound();
    }

    return (
        <CreateCoachPage
            coachId={coachId}
            initialValues={coach}
            profileValues={profileValues}
        />
    );
}
