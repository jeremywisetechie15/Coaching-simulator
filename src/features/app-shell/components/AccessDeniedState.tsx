import { ShieldAlert } from "lucide-react";
import { RouteStatusState } from "./RouteStatusState";

interface AccessDeniedStateProps {
    description?: string;
}

export function AccessDeniedState({
    description = "Votre rôle ne permet pas d'accéder à cette section. Revenez au tableau de bord ou contactez un administrateur si cet accès est nécessaire.",
}: AccessDeniedStateProps) {
    return (
        <RouteStatusState
            description={description}
            icon={ShieldAlert}
            primaryAction={{ href: "/", label: "Retour au tableau de bord" }}
            title="Vous n'êtes pas autorisé"
        />
    );
}
