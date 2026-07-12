import {
    AudioLines,
    Award,
    FileImage,
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
    VoiceDescriptor,
    type EntityProfileDetailSection,
} from "@/features/content/components";
import type { CoachDetail } from "@/features/coaches/domain/coach-list";
import { getCoachInitials } from "@/features/coaches/domain/coach-list";

interface CoachDetailsModalProps {
    coach: CoachDetail;
    onClose: () => void;
}

const optionalValue = (value: string) => value.trim() || "Non renseigné";

export function CoachDetailsModal({ coach, onClose }: CoachDetailsModalProps) {
    const sections: EntityProfileDetailSection[] = [
        {
            title: "Expertise et style",
            fields: [
                { icon: Target, label: "Domaine d’expertise", value: optionalValue(coach.expertiseDomain) },
                { icon: Sparkles, label: "Style de coaching", value: coach.coachingStyle },
                { icon: Shapes, label: "Profil DISC", value: <DiscProfileBadge profile={coach.discProfile} /> },
                {
                    icon: FileImage,
                    label: "Fond des sessions",
                    value: coach.backgroundImagePath ? "Image personnalisée" : "Fond par défaut",
                },
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
            title: "Voix et instructions",
            fields: [
                {
                    icon: Mic2,
                    label: "Voix",
                    value: `${coach.voiceName}${coach.voiceId ? ` (${coach.voiceId})` : ""}`,
                },
                {
                    icon: AudioLines,
                    label: "Caractéristique vocale",
                    value: (
                        <VoiceDescriptor
                            characteristic={coach.voiceCharacteristic}
                            fallback="Non renseignée"
                        />
                    ),
                },
                {
                    className: "sm:col-span-2",
                    icon: MessageSquareText,
                    label: "Comportement et méthode de coaching",
                    value: optionalValue(coach.systemInstructions),
                },
            ],
        },
    ];

    return (
        <EntityProfileDetailsModal
            avatarUrl={coach.avatarSrc}
            createdAt={coach.createdAt}
            description="Informations complètes du coach IA"
            initials={getCoachInitials(coach.name)}
            name={coach.name}
            onClose={onClose}
            sections={sections}
            status={<ContentStatusBadge status={coach.status} />}
            updatedAt={coach.updatedAt}
        />
    );
}
