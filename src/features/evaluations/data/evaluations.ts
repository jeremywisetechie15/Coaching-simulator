export type EvaluationStatus = "Publié" | "Brouillon";

export type QuizSectionIcon = "phone" | "target" | "shield" | "check" | "book";

export interface QuizOption {
    label: string;
    correct: boolean;
}

export interface QuizQuestion {
    id: string;
    /** QCU = choix unique, QCM = choix multiple. */
    type: "QCU" | "QCM";
    prompt: string;
    options: QuizOption[];
}

export interface QuizSection {
    id: string;
    title: string;
    icon: QuizSectionIcon;
    questions: QuizQuestion[];
}

export interface Evaluation {
    id: string;
    kind: string;
    status: EvaluationStatus;
    title: string;
    description: string;
    durationMinutes: number;
    tags: string[];
    quizTitle: string;
    quizSubtitle: string;
    sections: QuizSection[];
}

function qcu(id: string, prompt: string, correct: string, wrong: string[]): QuizQuestion {
    return {
        id,
        type: "QCU",
        prompt,
        options: [
            { label: correct, correct: true },
            ...wrong.map((label) => ({ label, correct: false })),
        ],
    };
}

const priseRdvSections: QuizSection[] = [
    {
        id: "demarrer",
        title: "Démarrer l'appel",
        icon: "phone",
        questions: [
            qcu(
                "rdv-1-1",
                "Quel est l'objectif principal du démarrage d'un appel ?",
                "Créer un climat de confiance et capter l'attention",
                [
                    "Vendre immédiatement le produit",
                    "Donner toutes les informations techniques",
                    "Demander directement un rendez-vous",
                ],
            ),
            qcu(
                "rdv-1-2",
                "Quelle est la meilleure façon de se présenter lors du démarrage de l'appel ?",
                "Se présenter clairement avec son nom, son entreprise et la raison de l'appel",
                [
                    "Être direct et rapide sans se présenter",
                    "Donner uniquement son prénom",
                    "Poser des questions avant de se présenter",
                ],
            ),
            qcu(
                "rdv-1-3",
                "Comment passer efficacement le barrage du standard ?",
                "Rester courtois et factuel, et demander directement la mise en relation",
                [
                    "Insister jusqu'à obtenir le transfert",
                    "Annoncer un long argumentaire commercial",
                    "Refuser de préciser le motif de l'appel",
                ],
            ),
            qcu(
                "rdv-1-4",
                "Que faire si le standard demande « C'est à quel sujet ? »",
                "Donner une réponse courte et orientée bénéfice pour le décideur",
                [
                    "Répondre « C'est commercial »",
                    "Rester vague en disant « au sujet de… »",
                    "Détailler l'ensemble de l'offre",
                ],
            ),
        ],
    },
    {
        id: "accroche",
        title: "Accroche",
        icon: "target",
        questions: [
            qcu(
                "rdv-2-1",
                "Quel est le but de l'accroche ?",
                "Capter l'intérêt du prospect en quelques secondes",
                [
                    "Présenter le catalogue complet de services",
                    "Obtenir un paiement immédiat",
                    "Terminer l'appel au plus vite",
                ],
            ),
            qcu(
                "rdv-2-2",
                "Sur quoi doit porter une bonne accroche ?",
                "Un enjeu ou un signal métier propre au prospect",
                [
                    "Les caractéristiques techniques du produit",
                    "L'historique de votre entreprise",
                    "Une promotion tarifaire générique",
                ],
            ),
            qcu(
                "rdv-2-3",
                "Quelle erreur faut-il éviter lors de l'accroche ?",
                "Ouvrir directement sur un pitch produit",
                [
                    "Contextualiser l'appel au prospect",
                    "Poser une question d'intérêt",
                    "Annoncer la durée de l'échange",
                ],
            ),
            qcu(
                "rdv-2-4",
                "Comment engager le prospect tôt dans l'échange ?",
                "Poser une question d'intérêt centrée sur sa situation",
                [
                    "Monologuer pendant plusieurs minutes",
                    "Énumérer toutes vos références clients",
                    "Demander tout de suite sa décision",
                ],
            ),
        ],
    },
    {
        id: "objections",
        title: "Gestion des objections",
        icon: "shield",
        questions: [
            qcu(
                "rdv-3-1",
                "Quelle est la première étape pour traiter une objection ?",
                "Accueillir l'objection et la reformuler avant d'y répondre",
                [
                    "Répondre immédiatement avec un argument",
                    "Ignorer l'objection et poursuivre",
                    "Justifier longuement votre démarche",
                ],
            ),
            qcu(
                "rdv-3-2",
                "Comment réagir face à l'objection « Je n'ai pas le temps » ?",
                "Proposer un échange court et cadré dans le temps",
                [
                    "Insister pour parler maintenant",
                    "Raccrocher poliment",
                    "Envoyer immédiatement un email",
                ],
            ),
            qcu(
                "rdv-3-3",
                "Quelle posture adopter face à une objection ?",
                "Rester calme et considérer l'objection comme un signal d'intérêt",
                [
                    "Se mettre sur la défensive",
                    "Montrer de l'agacement",
                    "Couper la parole au prospect",
                ],
            ),
            qcu(
                "rdv-3-4",
                "Que faire après avoir répondu à une objection ?",
                "Recentrer l'échange vers la demande de rendez-vous",
                [
                    "Enchaîner sur une nouvelle objection",
                    "Conclure l'appel sans rien proposer",
                    "Reprendre l'argumentaire depuis le début",
                ],
            ),
        ],
    },
    {
        id: "conclusion",
        title: "Conclusion / Prise de rendez-vous",
        icon: "check",
        questions: [
            qcu(
                "rdv-4-1",
                "Comment conclure efficacement un appel de prise de rendez-vous ?",
                "Proposer un choix limité de deux créneaux datés",
                [
                    "Laisser le prospect rappeler quand il veut",
                    "Proposer une dizaine de créneaux",
                    "Ne pas évoquer de date précise",
                ],
            ),
            qcu(
                "rdv-4-2",
                "Pourquoi verrouiller l'adresse email en fin d'appel ?",
                "Pour sécuriser l'envoi de l'invitation et limiter le no-show",
                [
                    "Pour ajouter le prospect à une newsletter",
                    "Pour vérifier son identité",
                    "Ce n'est pas nécessaire",
                ],
            ),
            qcu(
                "rdv-4-3",
                "Quelle erreur faut-il éviter à la conclusion ?",
                "Laisser un rendez-vous flou (« on se rappelle »)",
                [
                    "Confirmer le créneau par écrit",
                    "Reformuler l'objet du rendez-vous",
                    "Annoncer la durée de la rencontre",
                ],
            ),
            qcu(
                "rdv-4-4",
                "Que faire pour sécuriser la présence au rendez-vous ?",
                "Confirmer le créneau par écrit et envoyer une invitation agenda",
                [
                    "Ne rien envoyer après l'appel",
                    "Attendre que le prospect confirme seul",
                    "Reporter la confirmation à la veille",
                ],
            ),
        ],
    },
];

const entretienSections: QuizSection[] = [
    {
        id: "accueillir",
        title: "Accueillir",
        icon: "phone",
        questions: [
            qcu(
                "ent-1-1",
                "Quel est l'objectif de la phase d'accueil ?",
                "Créer un climat positif et professionnel dès les premières secondes",
                ["Présenter le tarif", "Conclure la vente", "Découvrir les besoins"],
            ),
            qcu(
                "ent-1-2",
                "Que faut-il annoncer en début d'entretien ?",
                "Le déroulé et la durée prévue de l'échange",
                [
                    "Le montant de la remise possible",
                    "La liste complète de vos clients",
                    "Les conditions générales de vente",
                ],
            ),
            qcu(
                "ent-1-3",
                "Quelle erreur éviter lors de l'accueil ?",
                "Entrer directement dans le vif sans cadrer l'échange",
                [
                    "Soigner les premières secondes",
                    "Obtenir un premier accord de principe",
                    "Adopter un ton chaleureux",
                ],
            ),
        ],
    },
    {
        id: "cadrer",
        title: "Cadrer",
        icon: "target",
        questions: [
            qcu(
                "ent-2-1",
                "À quoi sert la phase de cadrage ?",
                "Aligner les attentes réciproques et structurer l'entretien",
                [
                    "Signer le bon de commande",
                    "Présenter le produit en détail",
                    "Traiter les objections",
                ],
            ),
            qcu(
                "ent-2-2",
                "Comment valider le cadre avec le prospect ?",
                "Reformuler le contexte et faire valider l'ordre du jour",
                [
                    "Imposer son propre agenda",
                    "Passer directement à la proposition",
                    "Éviter de parler du déroulé",
                ],
            ),
            qcu(
                "ent-2-3",
                "Quel est le risque d'un entretien mal cadré ?",
                "Un échange décousu et centré produit plutôt que client",
                [
                    "Une découverte trop approfondie",
                    "Un prospect trop impliqué",
                    "Un cadre partagé trop clair",
                ],
            ),
        ],
    },
    {
        id: "decouvrir",
        title: "Découvrir",
        icon: "shield",
        questions: [
            qcu(
                "ent-3-1",
                "Quelle technique privilégier pour découvrir les besoins ?",
                "Le questionnement ouvert et l'écoute active",
                [
                    "L'argumentation produit",
                    "La présentation des tarifs",
                    "La conclusion rapide",
                ],
            ),
            qcu(
                "ent-3-2",
                "Que faut-il faire émerger pendant la découverte ?",
                "Les enjeux, les priorités et le processus de décision",
                [
                    "Uniquement le budget disponible",
                    "Les coordonnées de facturation",
                    "La date de signature",
                ],
            ),
            qcu(
                "ent-3-3",
                "Quelle erreur éviter en phase de découverte ?",
                "Présenter sa solution avant d'avoir compris le besoin",
                [
                    "Reformuler les réponses du prospect",
                    "Creuser les impacts métier",
                    "Poser des questions progressives",
                ],
            ),
        ],
    },
    {
        id: "confirmer",
        title: "Confirmer",
        icon: "check",
        questions: [
            qcu(
                "ent-4-1",
                "Quel est l'objectif de la phase de confirmation ?",
                "Valider le diagnostic partagé et engager vers la suite",
                [
                    "Recommencer la découverte",
                    "Allonger l'entretien",
                    "Éviter de conclure",
                ],
            ),
            qcu(
                "ent-4-2",
                "Comment sécuriser la prochaine étape ?",
                "Proposer une étape concrète, datée et confirmée par écrit",
                [
                    "Rester sur un accord verbal flou",
                    "Laisser le prospect décider seul plus tard",
                    "Ne pas fixer de date",
                ],
            ),
            qcu(
                "ent-4-3",
                "Que faire avant de conclure l'entretien ?",
                "Reformuler le diagnostic et le faire valider par le prospect",
                [
                    "Conclure sans validation",
                    "Présenter une nouvelle offre",
                    "Repousser la décision sans raison",
                ],
            ),
        ],
    },
];

const deepmarkSections: QuizSection[] = [
    {
        id: "reference",
        title: "Document de référence",
        icon: "book",
        questions: [
            qcu(
                "dm-1-1",
                "À quoi sert le document de référence DEEPMARK ?",
                "Servir de base commune pour aligner le discours commercial",
                [
                    "Remplacer la formation produit",
                    "Lister les prix concurrents",
                    "Archiver les anciens contrats",
                ],
            ),
            qcu(
                "dm-1-2",
                "Comment maîtriser le document de référence ?",
                "L'étudier régulièrement et valider sa compréhension par un quiz",
                [
                    "Le lire une seule fois",
                    "Le consulter uniquement en rendez-vous",
                    "L'ignorer au profit de l'expérience",
                ],
            ),
            qcu(
                "dm-1-3",
                "Quel est l'intérêt d'un référentiel partagé ?",
                "Garantir un discours cohérent au sein de l'équipe",
                [
                    "Multiplier les versions de l'argumentaire",
                    "Laisser chacun improviser",
                    "Compliquer la prospection",
                ],
            ),
        ],
    },
    {
        id: "argumentaire",
        title: "Argumentaire",
        icon: "target",
        questions: [
            qcu(
                "dm-2-1",
                "Sur quoi doit reposer un bon argumentaire ?",
                "Les bénéfices concrets pour le client, pas seulement les caractéristiques",
                [
                    "La longueur de la présentation",
                    "Le vocabulaire technique",
                    "Le nombre de fonctionnalités citées",
                ],
            ),
            qcu(
                "dm-2-2",
                "Comment renforcer la crédibilité d'un argument ?",
                "L'appuyer par une preuve ou un cas client concret",
                [
                    "Répéter l'argument plusieurs fois",
                    "Hausser le ton",
                    "Multiplier les promesses",
                ],
            ),
            qcu(
                "dm-2-3",
                "Quelle erreur éviter dans l'argumentation ?",
                "Dérouler un pitch générique sans lien avec le besoin",
                [
                    "Relier l'offre aux enjeux identifiés",
                    "Illustrer par des exemples",
                    "Reformuler les objections",
                ],
            ),
        ],
    },
    {
        id: "cas-pratiques",
        title: "Cas pratiques",
        icon: "check",
        questions: [
            qcu(
                "dm-3-1",
                "Pourquoi s'entraîner sur des cas pratiques ?",
                "Pour ancrer les réflexes avant les situations réelles",
                [
                    "Pour allonger la formation",
                    "Pour éviter la pratique terrain",
                    "Pour remplacer le coaching",
                ],
            ),
            qcu(
                "dm-3-2",
                "Comment exploiter un cas pratique raté ?",
                "L'analyser pour identifier les axes d'amélioration",
                [
                    "L'oublier rapidement",
                    "Refaire exactement la même chose",
                    "Changer de méthode à chaque fois",
                ],
            ),
            qcu(
                "dm-3-3",
                "Que valide un cas pratique réussi ?",
                "La bonne application de la méthode et du document de référence",
                [
                    "La chance du commercial",
                    "La rapidité d'exécution uniquement",
                    "L'absence de méthode",
                ],
            ),
        ],
    },
];

export const evaluations: Evaluation[] = [
    {
        id: "prise-de-rendez-vous",
        kind: "Quiz de Connaissance",
        status: "Publié",
        title: "Prise de rendez-vous",
        description:
            "Évaluez vos connaissances théoriques sur la prise de rendez-vous prospect qualifié",
        durationMinutes: 20,
        tags: ["DAGO", "Prise de RDV"],
        quizTitle: "Quiz de Connaissance",
        quizSubtitle: "Testez vos connaissances sur les 4 étapes de la prise de rendez-vous",
        sections: priseRdvSections,
    },
    {
        id: "entretien-commercial",
        kind: "Quiz de Connaissance",
        status: "Publié",
        title: "Entretien Commercial",
        description:
            "Maîtrisez la méthode ACDC pour mener un entretien commercial BtoB efficace",
        durationMinutes: 30,
        tags: ["AC/DC", "Entretien commercial", "BtoB"],
        quizTitle: "Quiz de Connaissance",
        quizSubtitle: "Testez vos connaissances sur les 4 étapes de l'entretien commercial",
        sections: entretienSections,
    },
    {
        id: "quiz-deepmark",
        kind: "Quiz de Connaissance",
        status: "Publié",
        title: "Quiz - DEEPMARK",
        description:
            "Validez la bonne maîtrise du document de référence et de l'argumentaire DEEPMARK",
        durationMinutes: 25,
        tags: ["Vente", "Négociation", "BtoB"],
        quizTitle: "Quiz de Connaissance",
        quizSubtitle: "Testez votre maîtrise du document de référence DEEPMARK",
        sections: deepmarkSections,
    },
];

/** Nombre total de questions d'une évaluation. */
export function getEvaluationQuestionCount(evaluation: Evaluation): number {
    return evaluation.sections.reduce((total, section) => total + section.questions.length, 0);
}
