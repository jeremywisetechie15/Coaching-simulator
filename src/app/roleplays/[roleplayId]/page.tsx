import { notFound, redirect } from "next/navigation";
import { RoleplayDetailPage } from "@/features/roleplays/components";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { roleplayId } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);

    return {
        title: roleplay ? `${roleplay.name} | Roleplays | MaiaCoach` : "Roleplay | MaiaCoach",
    };
}

export default async function Page({ params }: PageProps) {
    const { roleplayId } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);

    if (!roleplay) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/roleplays/${roleplayId}`);
    }

    return <RoleplayDetailPage profileValues={toProfileFormValues(profile)} roleplay={roleplay} />;
}
