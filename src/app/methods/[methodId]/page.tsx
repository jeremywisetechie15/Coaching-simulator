import { notFound, redirect } from "next/navigation";
import { MethodDetailPage } from "@/features/methods/components";
import { methods } from "@/features/methods/data/methods";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ methodId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { methodId } = await params;
    const method = methods.find((item) => item.id === methodId);

    return {
        title: method ? `${method.name} | MaiaCoach` : "Méthode | MaiaCoach",
    };
}

export default async function Page({ params }: PageProps) {
    const { methodId } = await params;
    const method = methods.find((item) => item.id === methodId);

    if (!method) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/methods/${methodId}`);
    }

    return <MethodDetailPage profileValues={toProfileFormValues(profile)} method={method} />;
}
