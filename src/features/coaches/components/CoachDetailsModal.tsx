import {
    Award,
    GraduationCap,
    MessageSquareText,
    Mic2,
    Shapes,
    Sparkles,
    Target,
} from "lucide-react";
import {
    ContentStatusBadge,
    DiscProfileBadge,
    EntityProfileDetailsModal,
    type EntityProfileDetailSection,
} from "@/features/content/components";
import type { CoachDetail } from "@/features/coaches/domain/coach-list";
import {
    getCoachBackgroundImageUrl,
    getCoachInitials,
} from "@/features/coaches/domain/coach-list";
import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface CoachDetailsModalProps {
    canManage: boolean;
    coach: CoachDetail;
    onClose: () => void;
}

const optionalValue = (value: string) => value.trim() || "Non renseigné";

export function CoachDetailsModal({ canManage, coach, onClose }: CoachDetailsModalProps) {
    const backgroundImageUrl = getCoachBackgroundImageUrl(coach.backgroundImageUrl);
    const sections: EntityProfileDetailSection[] = [
        {
            title: "Expertise et style",
            fields: [
                { icon: Target, label: "Domaine d’expertise", value: optionalValue(coach.expertiseDomain) },
                { icon: Sparkles, label: "Style de coaching", value: coach.coachingStyle },
                { icon: Shapes, label: "Profil DISC", value: <DiscProfileBadge profile={coach.discProfile} /> },
            ],
        },
        {
            title: "Diplômes et certifications",
            fields: [
                { icon: GraduationCap, label: "Diplôme", value: optionalValue(coach.diploma) },
                { icon: Award, label: "Certifications", value: optionalValue(coach.certifications) },
            ],
        },
        {
            title: canManage ? "Voix et instructions" : "Voix",
            fields: [
                {
                    icon: Mic2,
                    label: "Voix",
                    value: `${coach.voiceName}${coach.voiceId ? ` (${coach.voiceId})` : ""}`,
                },
                ...(canManage
                    ? [{
                        className: "sm:col-span-2",
                        icon: MessageSquareText,
                        label: "Comportement et méthode de coaching",
                        value: optionalValue(coach.systemInstructions),
                    }]
                    : []),
            ],
        },
    ];

    return (
        <EntityProfileDetailsModal
            avatarUrl={coach.avatarSrc}
            createdAt={coach.createdAt}
            description="Informations complètes du coach IA"
            headerBadge={canManage ? <ContentStatusBadge status={coach.status} /> : undefined}
            initials={getCoachInitials(coach.name)}
            name={coach.name}
            onClose={onClose}
            sections={sections}
            sidebarExtra={(
                <Box className={uiTokens.entityDetails.backgroundPreviewWrapper}>
                    <Text className={uiTokens.entityDetails.backgroundPreviewLabel}>
                        {coach.backgroundImagePath ? "Fond de session" : "Fond par défaut"}
                    </Text>
                    <Box
                        aria-label={`Fond de session de ${coach.name}`}
                        className={uiTokens.entityDetails.backgroundPreview}
                        role="img"
                        style={{ backgroundImage: `url("${backgroundImageUrl}")` }}
                    />
                </Box>
            )}
            updatedAt={coach.updatedAt}
        />
    );
}
