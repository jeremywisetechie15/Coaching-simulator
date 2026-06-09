import { notFound, redirect } from "next/navigation";
import { EvaluationPage } from "@/features/roleplays/components";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { roleplaySessions } from "@/features/roleplays/data/sessions";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export const metadata = {
    title: "Évaluation de la simulation | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { sessionId } = await params;
    const session = roleplaySessions.find((item) => item.id === sessionId);
    const roleplay = session ? roleplays.find((item) => item.id === session.roleplayId) : undefined;

    if (!session || !roleplay) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/roleplays/history/${sessionId}`);
    }

    return <EvaluationPage profileValues={toProfileFormValues(profile)} roleplay={roleplay} session={session} />;
}
