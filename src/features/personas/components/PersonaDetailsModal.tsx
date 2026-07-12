import {
    AudioLines,
    Baby,
    Banknote,
    BadgeEuro,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    FileText,
    Flag,
    GraduationCap,
    Heart,
    MapPin,
    MessageSquareText,
    Mic2,
    Shapes,
    UsersRound,
} from "lucide-react";
import {
    ContentStatusBadge,
    DiscProfileBadge,
    EntityProfileDetailsModal,
    VoiceDescriptor,
    type EntityProfileDetailSection,
} from "@/features/content/components";
import type { PersonaDetail } from "@/features/personas/domain/persona-list";
import { getPersonaInitials } from "@/features/personas/domain/persona-list";

interface PersonaDetailsModalProps {
    onClose: () => void;
    persona: PersonaDetail;
}

const optionalValue = (value: string) => value.trim() || "Non renseigné";

export function PersonaDetailsModal({ onClose, persona }: PersonaDetailsModalProps) {
    const sections: EntityProfileDetailSection[] = [
        {
            title: "Identité",
            fields: [
                { icon: BriefcaseBusiness, label: "Fonction", value: optionalValue(persona.role) },
                { icon: CalendarDays, label: "Âge", value: persona.age ? `${persona.age} ans` : "Non renseigné" },
            ],
        },
        {
            title: "Informations professionnelles",
            fields: [
                { icon: Building2, label: "Entreprise", value: optionalValue(persona.company) },
                { icon: Shapes, label: "Secteur d’activité", value: optionalValue(persona.industry) },
                { icon: UsersRound, label: "Nombre d’employés", value: optionalValue(persona.employeeCount) },
                { icon: BadgeEuro, label: "Chiffre d’affaires", value: optionalValue(persona.annualRevenue) },
                {
                    className: "sm:col-span-2",
                    icon: FileText,
                    label: "Descriptif de l’entreprise",
                    value: optionalValue(persona.companyDescription),
                },
            ],
        },
        {
            title: "Informations personnelles",
            fields: [
                { icon: Baby, label: "Nombre d’enfants", value: optionalValue(persona.childrenCount) },
                { icon: GraduationCap, label: "Diplôme", value: optionalValue(persona.diploma) },
                { icon: Heart, label: "Statut marital", value: optionalValue(persona.maritalStatus) },
                { icon: Flag, label: "Nationalité", value: optionalValue(persona.nationality) },
                { icon: MapPin, label: "Pays de résidence", value: optionalValue(persona.residenceCountry) },
                { icon: Banknote, label: "Revenu net avant impôt", value: optionalValue(persona.netIncomeBeforeTax) },
            ],
        },
        {
            title: "Profil et voix",
            fields: [
                { icon: Shapes, label: "Profil DISC", value: <DiscProfileBadge profile={persona.discProfile} /> },
                {
                    icon: Mic2,
                    label: "Voix",
                    value: `${persona.voiceName}${persona.voiceId ? ` (${persona.voiceId})` : ""}`,
                },
                {
                    icon: AudioLines,
                    label: "Caractéristique vocale",
                    value: (
                        <VoiceDescriptor
                            characteristic={persona.voiceCharacteristic}
                            fallback="Non renseignée"
                        />
                    ),
                },
                {
                    className: "sm:col-span-2",
                    icon: MessageSquareText,
                    label: "Informations complémentaires",
                    value: optionalValue(persona.systemInstructions),
                },
            ],
        },
    ];

    return (
        <EntityProfileDetailsModal
            avatarUrl={persona.avatarUrl}
            createdAt={persona.createdAt}
            description="Informations complètes du persona IA"
            initials={getPersonaInitials(persona.name)}
            name={persona.name}
            onClose={onClose}
            sections={sections}
            status={<ContentStatusBadge status={persona.status} />}
            updatedAt={persona.updatedAt}
        />
    );
}
