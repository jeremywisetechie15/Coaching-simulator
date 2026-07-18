/**
 * Suivi pédagogique d'un roleplay — page « État de mes compétences ».
 * Données de démonstration pour les anciens scénarios statiques.
 * Les types et calculs de progression vivent dans le domaine pour garder une SSOT.
 */

import type { RoleplayProgress as RoleplayProgressModel } from "@/features/roleplays/domain/roleplay-progress";

export { progressCompetencies, scoreLevel } from "@/features/roleplays/domain/roleplay-progress";
export type {
    CompetencySummary,
    DimensionDiagnostic,
    DimensionKey,
    DimensionModality,
    DimensionScore,
    ProgressCompetency,
    ProgressStep,
    RoleplayProgress,
    ScoreLevel,
} from "@/features/roleplays/domain/roleplay-progress";

const DIM_SAVOIR = "Bonne compréhension théorique. Vous maîtrisez les fondamentaux et pouvez les expliquer.";
const DIM_SF_OK = "Application pratique correcte. Vous savez appliquer les techniques dans les contextes connus.";
const DIM_SF_HESITANT = "Application pratique hésitante. Besoin de plus de pratique pour gagner en fluidité.";
const DIM_SF_DIFFICILE =
    "Difficultés dans l'application pratique. Multiplier les mises en situation et les entraînements.";
const DIM_SE_PERFECTIBLE = "Posture correcte mais perfectible. Travailler la confiance et la spontanéité dans votre attitude.";
const DIM_SE_INSUFFISANT =
    "Posture insuffisante. Développer votre assurance, votre naturel et votre impact relationnel.";
const DIM_SAVOIR_LACUNES = "Lacunes théoriques importantes. Réviser les fondamentaux et les méthodes essentielles.";

export const roleplayProgress: RoleplayProgressModel = {
    title: "Prise de rendez-vous prospect qualifié",
    masteryScore: 63,
    initialScore: 58,
    afterTraining: 63,
    delta: 5,
    target: 80,
    dimensions: [
        { key: "savoir", label: "Savoir", subtitle: "Théorie", score: 62 },
        { key: "savoir-faire", label: "Savoir-faire", subtitle: "Pratique", score: 53 },
        { key: "savoir-etre", label: "Savoir-être", subtitle: "Posture", score: 49 },
    ],
    modalities: [
        {
            label: "Quiz de Connaissance",
            icon: "quiz",
            score: 62,
            description: "Évalue le Savoir théorique des compétences mobilisées",
        },
        {
            label: "Simulations IA",
            icon: "simulation",
            score: 51,
            description: "Évalue le Savoir-faire et Savoir-être des compétences mobilisées",
        },
    ],
    steps: [
        {
            number: 1,
            title: "Démarrer l'appel et passer le barrage du standard",
            icon: "phone",
            score: 85,
            delta: 44,
            diagnostic:
                "Excellente maîtrise de cette étape ! Vous savez accéder au décideur avec efficacité. Votre théorie est solide (90%) et votre application pratique cohérente (85%). Pour atteindre l'excellence, concentrez-vous sur la naturalité et la conviction dans votre posture lors des premiers contacts (80%).",
            competencies: [
                {
                    name: "Accès au décideur",
                    score: 85,
                    initial: 45,
                    afterTraining: 75,
                    delta: 40,
                    dimensions: [
                        {
                            key: "savoir",
                            label: "Savoir",
                            score: 88,
                            diagnostic:
                                "Excellente maîtrise théorique. Vous connaissez les concepts, méthodes et techniques de façon approfondie.",
                        },
                        { key: "savoir-faire", label: "Savoir-faire", score: 84, diagnostic: DIM_SF_OK },
                        {
                            key: "savoir-etre",
                            label: "Savoir-être",
                            score: 83,
                            diagnostic:
                                "Bonne posture globale. Votre attitude est professionnelle dans la plupart des situations.",
                        },
                    ],
                },
            ],
        },
        {
            number: 2,
            title: "Se présenter et accrocher le prospect",
            icon: "message",
            score: 68,
            delta: 25,
            diagnostic:
                "Bonne maîtrise globale (68%) ! Votre présentation est structurée (72%) et vous parvenez à créer de l'intérêt (64%). Votre savoir théorique est excellent (80%). Pour progresser, travaillez l'impact de votre accroche en situation réelle et renforcez votre posture pour capter l'attention dès les premières secondes.",
            competencies: [
                {
                    name: "Présentation structurée",
                    score: 72,
                    initial: 48,
                    afterTraining: 65,
                    delta: 24,
                    dimensions: [
                        { key: "savoir", label: "Savoir", score: 80, diagnostic: DIM_SAVOIR },
                        { key: "savoir-faire", label: "Savoir-faire", score: 70, diagnostic: DIM_SF_OK },
                        { key: "savoir-etre", label: "Savoir-être", score: 66, diagnostic: DIM_SE_PERFECTIBLE },
                    ],
                },
                {
                    name: "Création d'intérêt",
                    score: 64,
                    initial: 40,
                    afterTraining: 58,
                    delta: 24,
                    dimensions: [
                        { key: "savoir", label: "Savoir", score: 72, diagnostic: DIM_SAVOIR },
                        { key: "savoir-faire", label: "Savoir-faire", score: 61, diagnostic: DIM_SF_HESITANT },
                        { key: "savoir-etre", label: "Savoir-être", score: 59, diagnostic: DIM_SE_PERFECTIBLE },
                    ],
                },
            ],
        },
        {
            number: 3,
            title: "Gérer les objections du prospect",
            icon: "shield",
            score: 46,
            delta: 7,
            diagnostic:
                "Point d'amélioration prioritaire (46%) ! La gestion des objections et la posture persuasive sont insuffisantes. Votre savoir théorique existe (55%) mais l'application pratique est fragile (40%). Entraînez-vous à accueillir les objections sans les contester, utilisez les questions de faille, et développez votre conviction naturelle.",
            competencies: [
                {
                    name: "Gestion des objections",
                    score: 44,
                    initial: 36,
                    afterTraining: 42,
                    delta: 8,
                    dimensions: [
                        {
                            key: "savoir",
                            label: "Savoir",
                            score: 55,
                            diagnostic: "Compréhension théorique correcte mais incomplète. Approfondir certains concepts clés.",
                        },
                        { key: "savoir-faire", label: "Savoir-faire", score: 40, diagnostic: DIM_SF_DIFFICILE },
                        { key: "savoir-etre", label: "Savoir-être", score: 37, diagnostic: DIM_SE_INSUFFISANT },
                    ],
                },
                {
                    name: "Posture persuasive",
                    score: 41,
                    initial: 39,
                    afterTraining: 40,
                    delta: 2,
                    dimensions: [
                        { key: "savoir", label: "Savoir", score: 48, diagnostic: DIM_SAVOIR_LACUNES },
                        { key: "savoir-faire", label: "Savoir-faire", score: 38, diagnostic: DIM_SF_DIFFICILE },
                        { key: "savoir-etre", label: "Savoir-être", score: 37, diagnostic: DIM_SE_INSUFFISANT },
                    ],
                },
            ],
        },
        {
            number: 4,
            title: "Conclure l'appel et fixer un Rendez-Vous",
            icon: "check",
            score: 35,
            delta: 7,
            diagnostic:
                "Zone de difficulté majeure (35%) ! Le closing et la sécurisation du RDV nécessitent un travail approfondi. Vous connaissez les techniques (50% en théorie) mais l'application est lacunaire (28-32%). Pratiquez les formulations de closing directes, utilisez l'alternative de créneaux, et systématisez la validation des modalités du RDV.",
            competencies: [
                {
                    name: "Closing du rendez-vous",
                    score: 38,
                    initial: 30,
                    afterTraining: 35,
                    delta: 8,
                    dimensions: [
                        { key: "savoir", label: "Savoir", score: 50, diagnostic: DIM_SAVOIR_LACUNES },
                        { key: "savoir-faire", label: "Savoir-faire", score: 32, diagnostic: DIM_SF_DIFFICILE },
                        { key: "savoir-etre", label: "Savoir-être", score: 32, diagnostic: DIM_SE_INSUFFISANT },
                    ],
                },
                {
                    name: "Sécurisation du RDV",
                    score: 32,
                    initial: 26,
                    afterTraining: 30,
                    delta: 6,
                    dimensions: [
                        { key: "savoir", label: "Savoir", score: 42, diagnostic: DIM_SAVOIR_LACUNES },
                        { key: "savoir-faire", label: "Savoir-faire", score: 28, diagnostic: DIM_SF_DIFFICILE },
                        { key: "savoir-etre", label: "Savoir-être", score: 26, diagnostic: DIM_SE_INSUFFISANT },
                    ],
                },
            ],
        },
    ],
};
