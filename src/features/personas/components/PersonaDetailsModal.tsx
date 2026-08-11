import {
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
    Edit3,
} from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import {
    ContentRemovalButton,
    ContentStatusBadge,
    DiscProfileBadge,
    EntityProfileDetailsModal,
    type EntityProfileDetailSection,
} from "@/features/content/components";
import type { PersonaDetail } from "@/features/personas/domain/persona-list";
import { getPersonaInitials } from "@/features/personas/domain/persona-list";
import { PERSONA_ROUTES } from "@/features/personas/domain/persona-routes";
import { getActivitySectorLabel } from "@/features/content/domain";
import {
    getPersonaPcsGroupLabel,
    getPersonaSexLabel,
} from "@/features/personas/domain/persona-demographics";
import { Box, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface PersonaDetailsModalProps {
    canManage: boolean;
    onClose: () => void;
    onRemove: () => void;
    persona: PersonaDetail;
}

const optionalValue = (value: string) => value.trim() || "Non renseigné";

export function PersonaDetailsModal({
    canManage,
    onClose,
    onRemove,
    persona,
}: PersonaDetailsModalProps) {
    const sections: EntityProfileDetailSection[] = [
        {
            title: "Identité",
            fields: [
                { icon: BriefcaseBusiness, label: "Fonction", value: optionalValue(persona.role) },
                { icon: CalendarDays, label: "Âge", value: persona.age ? `${persona.age} ans` : "Non renseigné" },
                { icon: UsersRound, label: "Sexe", value: getPersonaSexLabel(persona.sexCode) ?? "Non renseigné" },
                { icon: Shapes, label: "CSP INSEE", value: getPersonaPcsGroupLabel(persona.pcsGroupCode) ?? "Non renseigné" },
            ],
        },
        {
            title: "Informations professionnelles",
            fields: [
                { icon: Building2, label: "Entreprise", value: optionalValue(persona.company) },
                {
                    icon: Shapes,
                    label: "Secteur d’activité",
                    value: getActivitySectorLabel(persona.activitySectorCode) ?? "Non renseigné",
                },
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
                ...(canManage
                    ? [{
                        className: "sm:col-span-2",
                        icon: MessageSquareText,
                        label: "Informations complémentaires",
                        value: optionalValue(persona.systemInstructions),
                    }]
                    : []),
            ],
        },
    ];

    return (
        <EntityProfileDetailsModal
            avatarUrl={persona.avatarUrl}
            createdAt={persona.createdAt}
            description="Informations complètes du persona IA"
            headerActions={canManage ? (
                <Box className={uiTokens.resourceDetailHeader.actions}>
                    <ContextualLink
                        href={PERSONA_ROUTES.app.edit(persona.id)}
                        className={uiTokens.resourceDetailHeader.editButton}
                    >
                        <InlineIcon
                            icon={Edit3}
                            className={uiTokens.resourceDetailHeader.icon}
                        />
                        Modifier
                    </ContextualLink>
                    <ContentRemovalButton
                        onClick={onRemove}
                        status={persona.status}
                    />
                </Box>
            ) : undefined}
            headerBadge={canManage ? <ContentStatusBadge status={persona.status} /> : undefined}
            initials={getPersonaInitials(persona.name)}
            name={persona.name}
            onClose={onClose}
            sections={sections}
            updatedAt={persona.updatedAt}
        />
    );
}
