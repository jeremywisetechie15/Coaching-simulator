import { methods, type Method } from "@/features/methods/data/methods";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_DOMAINS,
    DISC_PROFILE,
    DISC_PROFILES,
    getCategoriesForDomain,
} from "@/features/content/domain";
import type { PrepDocument, PrepQuiz } from "./preparation";
import type { RoleplayDiscProfile, RoleplayIndexSession } from "@/features/roleplays/domain";

export type RoleplayDifficulty = "Facile" | "Moyen" | "Difficile";
export type RoleplayDisc = RoleplayDiscProfile;

export const roleplayDifficultyOptions: RoleplayDifficulty[] = ["Facile", "Moyen", "Difficile"];

export interface RoleplayDetail {
    bestScoreDate?: string;
    indexDelta?: number | null;
    indexScore?: number | null;
    indexSessions?: RoleplayIndexSession[];
    indexSessionCount?: number;
    indexTrend?: "up" | "down" | "stable" | "unavailable";
    lastDate: string;
    lastDuration: string;
    infoChips: { icon: "users" | "money" | "building" | "calendar"; label: string }[];
    scoreActuel: number;
    meilleurScore: number;
    simulations: number;
    context: string;
    objections: string;
    method: string;
}

export interface RoleplayItem {
    id: string;
    title?: string;
    /** Coach associé au scénario DB ; absent uniquement pour les anciens mocks. */
    coachId?: string;
    coachName?: string;
    coachAvatarSrc?: string;
    category: string;
    domain: string;
    name: string;
    role: string;
    company: string;
    avatarSrc: string;
    difficulty: RoleplayDifficulty;
    disc: RoleplayDisc;
    description: string;
    /** Id de la méthode pédagogique associée (voir methods.ts). */
    methodId: string;
    /** UUID Supabase du scénario, requis pour lancer le coach IA. */
    scenarioId?: string;
    /** Dernière session de l'utilisateur admissible à l'évaluation (durée >= seuil métier). */
    latestEvaluationSessionId?: string;
    /** Documents réellement attachés au scénario DB ; absent pour les mocks historiques. */
    prepDocuments?: PrepDocument[];
    /** Quiz réellement attachés au scénario DB ; absent pour les mocks historiques. */
    prepQuizzes?: PrepQuiz[];
    detail: RoleplayDetail;
}

export const roleplays: RoleplayItem[] = [
    {
        id: "rachid-hamrani",
        category: "Prise de rendez-vous",
        domain: "Commercial",
        name: "Rachid HAMRANI",
        role: "Dirigeant",
        company: "CLEANTECH",
        avatarSrc: "/roleplays/rachid-hamrani.png",
        difficulty: "Moyen",
        disc: "Stable",
        description:
            "Obtenir un RDV avec Rachid HAMRANI pour lui faire découvrir les produits et services de votre Banque et envisager une collaboration.",
        methodId: "dago",
        scenarioId: "2c31c5c6-761e-4a5f-9770-35ddc9edf4c6",
        detail: {
            lastDate: "25-03-2026",
            lastDuration: "06:37",
            infoChips: [
                { icon: "users", label: "25 employés" },
                { icon: "money", label: "5 M€ CA" },
                { icon: "building", label: "Nettoyage industriel" },
                { icon: "calendar", label: "42 ans" },
            ],
            scoreActuel: 70,
            meilleurScore: 90,
            simulations: 3,
            context:
                "Préparez un appel de prospection réaliste face à un dirigeant exigeant. Votre objectif est de capter son attention rapidement, de traiter ses objections avec précision et de décrocher un rendez-vous à forte valeur.",
            objections:
                "Rachid peut invoquer un manque de temps pour un RDV, une satisfaction avec sa banque actuelle, ou des doutes sur la valeur ajoutée de nouveaux services bancaires pour son entreprise.",
            method: "DAGO - Méthode DAGO",
        },
    },
    {
        id: "claude-savary",
        category: "Entretien de Remobilisation",
        domain: "Management",
        name: "Claude SAVARY",
        role: "Commercial Senior",
        company: "INNOVATECH",
        avatarSrc: "/roleplays/claude-savary.png",
        difficulty: "Moyen",
        disc: "Stable",
        description:
            "Vous rencontrez Claude SAVARY lors d'un entretien spécifique que vous avez organisé pour comprendre d'où viennent les difficultés et le remobiliser sur ces objectifs non atteints.",
        methodId: "4c",
        detail: {
            lastDate: "18-03-2026",
            lastDuration: "08:12",
            infoChips: [
                { icon: "users", label: "120 employés" },
                { icon: "money", label: "18 M€ CA" },
                { icon: "building", label: "Éditeur logiciel" },
                { icon: "calendar", label: "48 ans" },
            ],
            scoreActuel: 64,
            meilleurScore: 78,
            simulations: 5,
            context:
                "Conduisez un entretien de remobilisation avec un commercial senior en perte de motivation. Votre objectif est de comprendre les causes de la baisse de performance et de reconstruire son engagement.",
            objections:
                "Claude peut exprimer un sentiment d'injustice sur ses objectifs, un manque de reconnaissance ou une remise en question de la stratégie commerciale de l'entreprise.",
            method: "4C - Méthode 4C",
        },
    },
    {
        id: "sophie-martin",
        category: "Négociation",
        domain: "Commercial",
        name: "Sophie Martin",
        role: "Directrice des Achats",
        company: "TechCorp",
        avatarSrc: "/roleplays/sophie-martin.png",
        difficulty: "Facile",
        disc: "Influent",
        description: "Défendre votre proposition et aboutir à un accord ferme avec Sophie Martin",
        methodId: "acdc",
        detail: {
            lastDate: "20-03-2026",
            lastDuration: "05:48",
            infoChips: [
                { icon: "users", label: "350 employés" },
                { icon: "money", label: "60 M€ CA" },
                { icon: "building", label: "Technologie" },
                { icon: "calendar", label: "39 ans" },
            ],
            scoreActuel: 82,
            meilleurScore: 88,
            simulations: 2,
            context:
                "Menez une négociation commerciale face à une directrice des achats expérimentée. Votre objectif est de défendre la valeur de votre offre tout en préservant votre marge.",
            objections:
                "Sophie peut demander une remise importante, comparer votre offre à la concurrence ou conditionner l'accord à des engagements de volume.",
            method: "ACDC - Méthode ACDC",
        },
    },
    {
        id: "marc-dubois",
        category: "Vente",
        domain: "Commercial",
        name: "Marc Dubois",
        role: "Directeur Commercial",
        company: "Innovatech",
        avatarSrc: "/roleplays/marc-dubois.png",
        difficulty: "Difficile",
        disc: "Stable",
        description:
            "Présenter dans le détail les avantages de la solution « Trainer IA » et organiser une Démo de la plateforme afin de le convaincre définivement",
        methodId: "dago",
        detail: {
            lastDate: "22-03-2026",
            lastDuration: "09:24",
            infoChips: [
                { icon: "users", label: "200 employés" },
                { icon: "money", label: "35 M€ CA" },
                { icon: "building", label: "Services numériques" },
                { icon: "calendar", label: "51 ans" },
            ],
            scoreActuel: 58,
            meilleurScore: 72,
            simulations: 4,
            context:
                "Présentez la solution « Trainer IA » à un directeur commercial exigeant. Votre objectif est de démontrer la valeur concrète de l'outil et d'obtenir l'accord pour une démonstration.",
            objections:
                "Marc peut douter du retour sur investissement, craindre la conduite du changement dans ses équipes ou évoquer un budget déjà engagé ailleurs.",
            method: "DAGO - Méthode DAGO",
        },
    },
    {
        id: "thomas-lion",
        category: "Vente",
        domain: "Commercial",
        name: "Thomas Lion",
        role: "CEO",
        company: "INNOVATECH",
        avatarSrc: "/roleplays/thomas-lion.png",
        difficulty: "Moyen",
        disc: "Consciencieux",
        description:
            "Identifier et comprendre les besoins de formation de Thomas Lion pour le prochain semestre. Récolter les informations nécessaires pour pouvoir établir une proposition de formation de qualité. Se positionner auprès de Thomas Lion comme un l'acteur idéal pour ce projet",
        methodId: "4c",
        detail: {
            lastDate: "24-03-2026",
            lastDuration: "07:05",
            infoChips: [
                { icon: "users", label: "80 employés" },
                { icon: "money", label: "12 M€ CA" },
                { icon: "building", label: "Technologie" },
                { icon: "calendar", label: "45 ans" },
            ],
            scoreActuel: 75,
            meilleurScore: 84,
            simulations: 3,
            context:
                "Conduisez un entretien de découverte avec le CEO d'une entreprise technologique. Votre objectif est d'identifier ses besoins de formation et de vous positionner comme le partenaire idéal.",
            objections:
                "Thomas peut demander des preuves chiffrées, comparer plusieurs prestataires ou repousser la décision à un prochain comité de direction.",
            method: "4C - Méthode 4C",
        },
    },
];

export const categoryBadgeStyles: Record<string, { bg: string; text: string }> = {
    "Prise de rendez-vous": { bg: "#F3E8FD", text: "#8B2FD6" },
    "Entretien de Remobilisation": { bg: "#DCE8FB", text: "#2552D6" },
    Négociation: { bg: "#F3E8FD", text: "#8B2FD6" },
    Vente: { bg: "#F3E8FD", text: "#8B2FD6" },
    Recommandation: { bg: "#F3E8FD", text: "#8B2FD6" },
};

export const difficultyBadgeStyles: Record<RoleplayDifficulty, { bg: string; border: string; text: string }> = {
    Facile: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A" },
    Moyen: { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
    Difficile: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
};

export const roleplayDomainFilterOptions = ["Tous les domaines", ...CONTENT_DOMAINS];

export const roleplayCategoryFilterOptions = ["Toutes les catégories", ...ALL_CONTENT_CATEGORIES];

export const roleplayLevelFilterOptions = ["Tous les niveaux", ...roleplayDifficultyOptions];

export const roleplayDiscFilterOptions = [
    "Tous les DISC",
    ...DISC_PROFILES,
    DISC_PROFILE.unknown,
];

export interface RoleplayLibraryFilters {
    category: string;
    disc: string;
    domain: string;
    level: string;
}

export function getRoleplayCategoryFilterOptions(domain: string) {
    if (domain === roleplayDomainFilterOptions[0]) {
        return roleplayCategoryFilterOptions;
    }

    return [roleplayCategoryFilterOptions[0], ...getCategoriesForDomain(domain)];
}

export function filterRoleplaysByLibraryFilters(roleplayItems: RoleplayItem[], filters: RoleplayLibraryFilters) {
    return roleplayItems.filter((roleplay) => {
        const matchesDomain =
            filters.domain === roleplayDomainFilterOptions[0] || roleplay.domain === filters.domain;
        const matchesCategory =
            filters.category === roleplayCategoryFilterOptions[0] || roleplay.category === filters.category;
        const matchesLevel = filters.level === roleplayLevelFilterOptions[0] || roleplay.difficulty === filters.level;
        const matchesDisc = filters.disc === roleplayDiscFilterOptions[0] || roleplay.disc === filters.disc;

        return matchesDomain && matchesCategory && matchesLevel && matchesDisc;
    });
}

// --- Create scenario options ---

export const roleplayPersonaOptions = [
    "Rachid HAMRANI",
    "Julien LEBEL",
    "Claire DUBOIS",
    "Claude SAVARY",
    "Sophie Martin",
    "Marc Dubois",
    "Thomas Lion",
];

export const roleplayCoachOptions = ["Pierre Laurent"];

export const roleplayMethodOptions = ["Méthode DAGO", "Méthode 4C", "Méthode ACDC"];

export const roleplayEvaluationOptions = [
    "Quiz - DEEPMARK",
    "Entretien Commercial",
    "Découverte des besoins",
    "Prise de rendez-vous",
];

export const roleplayDomainOptions = [...CONTENT_DOMAINS];

export const roleplayCategoryOptions = [...ALL_CONTENT_CATEGORIES];

/** Retourne la méthode pédagogique associée à un roleplay, ou null si introuvable. */
export function getRoleplayMethod(roleplay: RoleplayItem): Method | null {
    return methods.find((method) => method.id === roleplay.methodId) ?? null;
}
