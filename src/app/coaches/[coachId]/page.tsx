import { notFound, redirect } from "next/navigation";
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
        coach = await getCoachById(coachId);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/coaches/${coachId}`);
        }

        if (error instanceof ForbiddenError) {
            notFound();
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
            profileValues={toProfileFormValues(profile)}
        />
    );
}
