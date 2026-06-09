export type SkillCategory = "Métier" | "Comportementale" | "Transversale";

export interface SkillItem {
    id: string;
    name: string;
    category: SkillCategory;
}

export const skills: SkillItem[] = [
    { id: "acces-decideur", name: "Accès au décideur", category: "Métier" },
    { id: "presentation-structuree", name: "Présentation structurée", category: "Métier" },
    { id: "creation-interet-immediat", name: "Création d'intérêt immédiat", category: "Métier" },
    { id: "gestion-objections", name: "Gestion des objections", category: "Métier" },
    { id: "posture-persuasive", name: "Posture persuasive", category: "Comportementale" },
    { id: "closing-rendez-vous", name: "Closing du rendez-vous", category: "Métier" },
    { id: "securisation-rendez-vous", name: "Sécurisation du rendez-vous", category: "Métier" },
    { id: "preparation-commerciale", name: "Préparation commerciale", category: "Métier" },
    { id: "creation-relation", name: "Création de relation", category: "Comportementale" },
    { id: "credibilite-personnelle", name: "Crédibilité personnelle", category: "Comportementale" },
    { id: "credibilite-societe", name: "Crédibilité société", category: "Métier" },
    { id: "cadrage-echange", name: "Cadrage de l'échange", category: "Métier" },
    { id: "comprehension-business", name: "Compréhension business du client", category: "Métier" },
    { id: "questionnement-consultatif", name: "Questionnement consultatif", category: "Métier" },
    {
        id: "ecoute-active-reformulation",
        name: "Écoute active et reformulation intermédiaire",
        category: "Comportementale",
    },
    { id: "posture-challenger", name: "Posture Challenger", category: "Comportementale" },
    { id: "diagnostic-problemes-impacts", name: "Diagnostic des problèmes et impacts", category: "Métier" },
    {
        id: "identification-besoins-gains",
        name: "Identification des besoins et gains attendus",
        category: "Métier",
    },
    { id: "construction-pre-achat", name: "Construction du pré-achat", category: "Métier" },
    { id: "exploration-freins", name: "Exploration des freins", category: "Métier" },
    { id: "analyse-processus-decision", name: "Analyse du processus de décision", category: "Métier" },
    {
        id: "analyse-concurrence-existant",
        name: "Analyse de la concurrence et de l'existant",
        category: "Métier",
    },
    { id: "identification-motivations-achat", name: "Identification des motivations d'achat", category: "Métier" },
    {
        id: "validation-diagnostic-accord",
        name: "Validation du diagnostic et accord pour avancer",
        category: "Métier",
    },
    { id: "pilotage-entretien", name: "Pilotage de l'entretien", category: "Transversale" },
    { id: "communication-professionnelle", name: "Communication professionnelle", category: "Transversale" },
];

export const skillCategoryStyles: Record<SkillCategory, { bg: string; border: string; text: string }> = {
    Métier: { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
    Comportementale: { bg: "#FAF5FF", border: "#D8B4FE", text: "#9333EA" },
    Transversale: { bg: "#ECFDF5", border: "#6EE7B7", text: "#059669" },
};

export const skillDomainOptions = ["Tous les domaines", "Commercial", "Méthode ACDC"];

export const skillTypeOptions = ["Tous les types", "Métier", "Comportementale", "Transversale"];

export const skillFunctionOptions = [
    "Toutes les fonctions",
    "Sales",
    "Marketing",
    "Customer Success",
    "Product",
    "Operations",
    "Finance",
    "HR",
    "Leadership",
];

export const skillObjectiveOptions = [
    "Tous les objectifs",
    "Prise de rendez-vous prospect qualifié",
    "Méthode AC/DC - Étape Accueillir",
    "Méthode AC/DC - Étape Cadrer",
    "Méthode AC/DC - Étape Découvrir",
    "Méthode AC/DC - Étape Confirmer",
    "Méthode AC/DC - Compétence Transverse",
];
