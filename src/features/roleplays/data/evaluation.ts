export type StepStatus = "À renforcer" | "À consolider" | "À maintenir";

export interface EvaluationCriterion {
    critere: string;
    competence?: string;
    preuvesAttendues: string;
    points: string;
    preuvesObservees: { quote: string; speaker: string; time: string }[];
    analyse: string;
    conseils: string;
    verbatim: string;
}

export interface StepTranscriptLine {
    speaker: "you" | "persona";
    text: string;
}

export interface StepReformulation {
    original: string;
    pourquoi: string;
    suggestion: string;
}

export interface EvaluationStep {
    number: number;
    title: string;
    icon: "phone" | "message" | "shield" | "check";
    score: number;
    status: StepStatus;
    total: string;
    /** Sections affichées dans l'accordéon de l'étape (optionnelles : absentes tant que la data n'est pas branchée). */
    commentaireCoach?: string;
    criteresReussis?: string[];
    criteresAAmeliorer?: string[];
    stepTranscript?: { start: string; end: string; lines: StepTranscriptLine[] };
    reformulations?: StepReformulation[];
    /** Grille détaillée affichée dans la dialog « Voir l'analyse détaillée ». */
    criteria: EvaluationCriterion[];
}

export interface DiscourseMetric {
    title: string;
    value: string;
    subtitle?: string;
    reco?: "ok" | "warn";
}

export interface TranscriptMessage {
    id?: string;
    speaker: "you" | "persona";
    time: string;
    text: string;
}

export type EvaluationKeyMomentImpactType =
    | "moment_cle_negatif"
    | "moment_cle_positif"
    | "opportunite_manquee"
    | "moment_sensible";

export interface EvaluationKeyMoment {
    clientPerception: string;
    competencies: string[];
    description: string;
    id: string;
    impact: string;
    impactOnObjective: string;
    impactType: EvaluationKeyMomentImpactType;
    number: number;
    reason: string;
    recommendedResponse: string;
    role: string;
    stepLabel: string;
    time: string;
    title: string;
    transcript: Array<{
        speaker: string;
        text: string;
        time: string;
    }>;
}

export interface Evaluation {
    personaAvis: string;
    coachAppreciation: string;
    pointsPositifs: string[];
    axesAmelioration: string[];
    prioriteStrategique: string;
    planEtape: { number: number; title: string; text: string };
    planEtapes?: { number: number; title: string; text: string }[];
    scoreDetails?: {
        rows: {
            contribution: number;
            poids: number;
            score: number;
            stepNumber: number;
            title: string;
        }[];
        total: number;
    };
    steps: EvaluationStep[];
    discourse: DiscourseMetric[];
    momentsCles: EvaluationKeyMoment[];
    transcript: TranscriptMessage[];
}

export const stepStatusStyles: Record<StepStatus, { bg: string; text: string }> = {
    "À renforcer": { bg: "#FEF2F2", text: "#DC2626" },
    "À consolider": { bg: "#FFF7ED", text: "#C2410C" },
    "À maintenir": { bg: "#F0FDF4", text: "#16A34A" },
};

/** Données temporaires de prévisualisation, remplacées ensuite par synthese.moments_cles. */
export const demoEvaluationKeyMoments: EvaluationKeyMoment[] = [
    {
        clientPerception:
            "Je comprends immédiatement le cadre de l'échange et je suis disposé à poursuivre la conversation.",
        competencies: [],
        description: "Ouverture claire et orientée vers l'interlocuteur.",
        id: "demo-key-moment-1",
        impact: "Cadre posé, attention obtenue",
        impactOnObjective: "L'interlocuteur accepte de poursuivre l'échange.",
        impactType: "moment_cle_positif",
        number: 1,
        reason:
            "Ce passage installe un cadre clair et donne au persona une raison concrète d'accorder du temps à l'échange.",
        recommendedResponse:
            "Conserver une ouverture concise qui précise l'objectif et la valeur attendue pour l'interlocuteur.",
        role: "Apprenant",
        stepLabel: "Étape 1 : Ouvrir et cadrer l'échange",
        time: "00:18",
        title: "Clarification immédiate de l'objectif de l'échange",
        transcript: [{
            speaker: "Apprenant",
            text: "Je vous propose un échange très court pour vérifier si ce sujet correspond à vos priorités actuelles.",
            time: "00:18",
        }],
    },
    {
        clientPerception:
            "Je me sens écouté et je constate que mon besoin est compris sans être déformé.",
        competencies: [],
        description: "Reformulation fidèle du besoin exprimé.",
        id: "demo-key-moment-2",
        impact: "Besoin clarifié, confiance renforcée",
        impactOnObjective: "Le besoin est validé avant la proposition d'une réponse.",
        impactType: "moment_cle_positif",
        number: 2,
        reason:
            "La reformulation valide la compréhension du besoin et réduit le risque de proposer une réponse trop générique.",
        recommendedResponse:
            "Maintenir cette reformulation, puis demander une validation explicite avant de poursuivre.",
        role: "Apprenant",
        stepLabel: "Étape 2 : Explorer et comprendre",
        time: "01:42",
        title: "Reformulation précise du besoin exprimé",
        transcript: [{
            speaker: "Apprenant",
            text: "Si je reformule, votre priorité est d'obtenir un résultat concret sans alourdir le fonctionnement actuel de vos équipes.",
            time: "01:42",
        }],
    },
    {
        clientPerception:
            "La suite est claire et je sais exactement ce qui va se passer après notre échange.",
        competencies: [],
        description: "Conclusion avec une prochaine étape explicite.",
        id: "demo-key-moment-3",
        impact: "Prochaine étape claire, engagement sécurisé",
        impactOnObjective: "L'échange aboutit à un engagement concret.",
        impactType: "moment_cle_positif",
        number: 3,
        reason:
            "La validation d'une action concrète transforme l'échange en engagement et évite une conclusion imprécise.",
        recommendedResponse:
            "Confirmer l'objectif, le format et le délai de la prochaine étape avant de terminer.",
        role: "Apprenant",
        stepLabel: "Étape 4 : Conclure et engager",
        time: "03:05",
        title: "Validation d'une prochaine étape concrète",
        transcript: [{
            speaker: "Apprenant",
            text: "Je vous envoie la synthèse aujourd'hui et nous validons ensemble les deux points prioritaires lors de notre prochain échange.",
            time: "03:05",
        }],
    },
];

export const evaluation: Evaluation = {
    personaAvis:
        "J'ai ressenti une prise de contact professionnelle et respectueuse de mon temps. Après un début un peu large, la discussion a rapidement été orientée sur mes priorités (poste client, BFR) et la proposition de valeur s'est clarifiée. Je me suis senti écouté et le dialogue était centré sur mes besoins réels. La confirmation du rendez-vous était efficace et rassurante, ce qui m'a donné confiance pour accepter l'échange.",
    coachAppreciation:
        "L'appel démontre une maîtrise de la relation, une écoute active et une forte orientation client. Après une ouverture perfectible, l'échange bascule sur une vraie co-construction, la gestion des objections est saine et l'engagement obtenu est sécurisé et clair. Professionnalisme, réactivité et structuration générale ressortent nettement.",
    momentsCles: demoEvaluationKeyMoments,
    pointsPositifs: [
        "Le rendez-vous a été sécurisé rapidement avec validation du format, du créneau précis et de l'adresse mail.",
        "L'objection de 'présentation générique' a été traitée par une posture d'écoute et de recentrage sur les besoins du prospect.",
        "Proposition de valeur adaptée autour de la gestion du poste client et du BFR.",
    ],
    axesAmelioration: [
        "Rendre l'accroche initiale plus concise et immédiatement centrée sur un enjeu métier spécifique au prospect, sans rester sur des généralités bancaires trop larges.",
        "Limiter dès le début le champ lexical du 'catalogue de produits' pour éviter l'impression d'un pitch banque classique.",
    ],
    prioriteStrategique:
        "La priorité stratégique absolue est de personnaliser et contextualiser l'accroche dès les toutes premières secondes, afin de capter plus vite l'attention du décideur et d'éviter le risque de filtrage ou de rendez-vous refusé.",
    planEtape: {
        number: 1,
        title: "Accroche contextualisée et bénéfice immédiat",
        text: "Dès l'accroche, contextualiser immédiatement l'appel par un bénéfice concret ou un signal lié au métier ou à l'actualité du prospect, afin d'éviter la perception d'un contact trop large ou générique.",
    },
    steps: [
        {
            number: 1,
            title: "Démarrer et passer le barrage",
            icon: "phone",
            score: 50,
            status: "À renforcer",
            total: "10/20",
            commentaireCoach:
                "L'ouverture est correcte mais le motif d'appel reste trop générique : le ciblage et le signal business ne sont pas assez explicites pour capter immédiatement l'attention.",
            criteresReussis: ["Identité et société annoncées clairement", "Ton professionnel dès le décroché"],
            criteresAAmeliorer: [
                "Contextualiser le motif d'appel par un signal métier précis",
                "Énoncer l'objectif de l'appel dès les premières secondes",
            ],
            stepTranscript: {
                start: "00:00",
                end: "01:12",
                lines: [
                    {
                        speaker: "you",
                        text: "Bonjour, Paul Laverdure de la Société Générale, je souhaiterais parler à Monsieur Amrani.",
                    },
                    { speaker: "persona", text: "C'est à quel sujet ?" },
                    {
                        speaker: "you",
                        text: "Un point sur l'optimisation de votre poste client qui mérite quelques minutes d'échange.",
                    },
                ],
            },
            reformulations: [
                {
                    original: "Je vous appelle pour vous présenter nos services bancaires.",
                    suggestion:
                        "Je vous appelle car nous aidons des dirigeants comme vous à libérer de la trésorerie sur leur poste client — c'est un sujet d'actualité chez vous ?",
                    pourquoi: "Remplace un motif générique par un bénéfice contextualisé et une question d'engagement.",
                },
            ],
            criteria: [
                {
                    critere: "Préparation visible et ciblage précis",
                    preuvesAttendues: "Nom, fonction, société, motif court, ciblage signal business.",
                    points: "2.5/5",
                    preuvesObservees: [
                        {
                            quote: "Oui, bonjour, je cherche à rejoindre Richard Amrani, s'il vous plaît.",
                            speaker: "Apprenant",
                            time: "19:13:51",
                        },
                        {
                            quote: "Oui, bonjour M. Amrani, c'est Paul Laverdure de la Société Générale.",
                            speaker: "Apprenant",
                            time: "19:14:00",
                        },
                    ],
                    analyse:
                        "Nom société et destinataire annoncés, mais motif/décideur pas assez précis ni enrichi d'un signal.",
                    conseils:
                        "Préparez une motivation contextualisée et énoncez clairement le rôle et l'objectif dès le début.",
                    verbatim: "Bonjour, [Prénom Nom] de [Société], je souhaiterais parler à Monsieur/Madame [Nom].",
                },
                {
                    critere: "Formulation courte de la demande de mise en relation",
                    preuvesAttendues: "Demande brève pour joindre sans justification.",
                    points: "2/4",
                    preuvesObservees: [
                        {
                            quote: "je cherche à rejoindre Richard Amrani, s'il vous plaît.",
                            speaker: "Apprenant",
                            time: "19:13:51",
                        },
                    ],
                    analyse: "Demande directe mais suivie de justifications et d'une formulation moins directe.",
                    conseils: "Soyez plus direct et limitez la justification avant de poser la demande d'action.",
                    verbatim: "Pouvez-vous me le/la passer, s'il vous plaît ?",
                },
                {
                    critere: "Réponse à 'c'est à quel sujet ?'",
                    preuvesAttendues: "Motif en une phrase, orienté enjeux.",
                    points: "4/4",
                    preuvesObservees: [
                        {
                            quote:
                                "Au centre d'affaires à la défense, je me permets de vous appeler de la part de Stéphane Dubois qui est un de vos clients, société Satec.",
                            speaker: "Apprenant",
                            time: "19:14:06",
                        },
                    ],
                    analyse: "Motif donné avec référence à une recommandation, contexte professionnel.",
                    conseils: "Réduisez davantage la formulation pour la rendre encore plus courte.",
                    verbatim: "C'est à propos d'un point rapide / projet sur [thématique].",
                },
                {
                    critere: "Attitude agenda-friendly",
                    preuvesAttendues: "Remerciements, proposition ou acceptation d'un rappel.",
                    points: "1.5/3",
                    preuvesObservees: [
                        {
                            quote: "Oui, bonjour M. Amrani, c'est Paul Laverdure de la Société Générale.",
                            speaker: "Apprenant",
                            time: "19:14:00",
                        },
                    ],
                    analyse:
                        "Politesse présente mais peu d'attitude agenda-friendly active (pas de vérification du bon moment ou de proposition de rappel initial, posture assez classique).",
                    conseils:
                        "Ajoutez systématiquement une validation du temps ou une question sur la disponibilité dès la 1e minute.",
                    verbatim:
                        "Merci de m'accorder quelques instants. À quel moment me conseillez-vous de le/la rappeler ?",
                },
                {
                    critere: "Plan B ou issue alternative obtenue",
                    preuvesAttendues: "Suite proposée si barrage ou refus, issue alternative claire.",
                    points: "0/4",
                    preuvesObservees: [],
                    analyse: "Aucune alternative proposée à ce stade.",
                    conseils: "Sécurisez toujours une suite même si le prospect refuse le rdv d'emblée.",
                    verbatim:
                        "Pouvez-vous me confirmer son adresse mail directe ? À quel moment me conseillez-vous de rappeler ?",
                },
            ],
        },
        {
            number: 2,
            title: "Accrocher",
            icon: "message",
            score: 62,
            status: "À consolider",
            total: "12.5/20",
            commentaireCoach:
                "L'accroche capte l'intérêt mais reste centrée produit. La valeur perçue gagnerait à être reliée plus tôt à un enjeu concret du prospect.",
            criteresReussis: ["Présentation claire et légitime", "Bonne énergie et écoute des réactions"],
            criteresAAmeliorer: [
                "Relier l'accroche à un enjeu métier spécifique",
                "Poser une question d'ouverture avant de dérouler l'offre",
            ],
            stepTranscript: {
                start: "01:12",
                end: "01:30",
                lines: [
                    {
                        speaker: "you",
                        text: "On accompagne les entreprises de votre secteur sur la gestion du poste client et du BFR.",
                    },
                    { speaker: "persona", text: "On a déjà une banque, qu'est-ce que vous faites de différent ?" },
                ],
            },
            reformulations: [
                {
                    original: "On propose une gamme complète de services bancaires.",
                    suggestion:
                        "Beaucoup de dirigeants de votre secteur perdent du cash sur leurs délais de paiement — comment gérez-vous ça aujourd'hui ?",
                    pourquoi: "Passe d'un pitch catalogue à un enjeu concret + question de découverte.",
                },
            ],
            criteria: [
                {
                    critere: "Phrase d'accroche centrée sur un enjeu",
                    preuvesAttendues: "Bénéfice concret ou signal métier dès la première phrase.",
                    points: "3/5",
                    preuvesObservees: [
                        {
                            quote: "Je me permets de vous appeler car nous accompagnons des entreprises comme la vôtre.",
                            speaker: "Apprenant",
                            time: "19:14:20",
                        },
                    ],
                    analyse: "Accroche correcte mais encore générique, peu personnalisée au prospect.",
                    conseils: "Ouvrez sur un enjeu précis et observable du prospect plutôt qu'une formule générale.",
                    verbatim: "J'ai vu que [signal] — c'est exactement le sujet sur lequel je voulais échanger.",
                },
                {
                    critere: "Création d'intérêt et accroche d'une question",
                    preuvesAttendues: "Question d'intérêt qui engage le prospect rapidement.",
                    points: "3.5/5",
                    preuvesObservees: [
                        {
                            quote: "Comment gérez-vous aujourd'hui votre poste client ?",
                            speaker: "Apprenant",
                            time: "19:14:48",
                        },
                    ],
                    analyse: "Bonne question d'engagement, posée toutefois un peu tard dans l'échange.",
                    conseils: "Posez la question d'intérêt plus tôt pour capter l'attention dès l'ouverture.",
                    verbatim: "Sur [enjeu], où en êtes-vous aujourd'hui ?",
                },
            ],
        },
        {
            number: 3,
            title: "Gérer les objections",
            icon: "shield",
            score: 60,
            status: "À consolider",
            total: "12/20",
            commentaireCoach:
                "Les objections principales (prix, mesure de l'impact) sont identifiées, reformulées et traitées avec des arguments concrets et chiffrés. L'alternative du groupe pilote est acceptée mais pourrait être plus cadrée (date, processus précis). Bonne qualité relationnelle, aucune confrontation.",
            criteresReussis: ["Traite en détail l'objection prix/valeur", "Climat professionnel et factuel"],
            criteresAAmeliorer: [
                "Renforcer la structure sur chaque objection complexe",
                "Proposer une alternative plus cadrée (date, format précis)",
            ],
            stepTranscript: {
                start: "01:30",
                end: "03:29",
                lines: [
                    {
                        speaker: "persona",
                        text: "Maintenant, comment mesurez-vous l'impact concret sur nos équipes pour justifier cet investissement ?",
                    },
                    {
                        speaker: "you",
                        text: "Vous aurez l'occasion de tester les compétences de vos collaborateurs grâce à notre plateforme Maya Coach, avec un diagnostic personnalisé avant et après la formation.",
                    },
                    {
                        speaker: "you",
                        text: "On constate en général un niveau d'environ 50 à 60 %, proche de 80 à 90 % en fin de formation — soit un gain d'environ 30 points.",
                    },
                    {
                        speaker: "you",
                        text: "Si vous avez besoin d'être rassurée, je peux vous montrer à travers un groupe pilote l'évolution des compétences sur une base factuelle et observable.",
                    },
                ],
            },
            reformulations: [
                {
                    original:
                        "Si vous avez besoin d'être rassuré, oui, pas de souci. Je pourrais vous montrer à travers ce groupe pilote l'évolution des compétences sur une base factuelle et observable.",
                    suggestion:
                        "C'est pertinent en effet. Je vous propose : on débute avec un groupe pilote, on mesure l'avant-après avec Maya Coach, puis on présente ensemble les résultats d'ici 3 semaines. Ok pour formaliser ce plan ?",
                    pourquoi: "Formalise l'alternative, ajoute un cadrage de timing et d'étape suivante.",
                },
            ],
            criteria: [
                {
                    critere: "Écoute et reformulation de l'objection",
                    preuvesAttendues: "Reformulation de l'objection avant d'y répondre.",
                    points: "3/5",
                    preuvesObservees: [
                        {
                            quote: "Si je comprends bien, vous trouvez la démarche un peu générique.",
                            speaker: "Apprenant",
                            time: "19:15:30",
                        },
                    ],
                    analyse: "Reformulation présente mais réponse parfois trop rapide après l'objection.",
                    conseils: "Laissez le prospect confirmer la reformulation avant de répondre.",
                    verbatim: "Si je vous suis bien, votre point c'est [reformulation] — c'est ça ?",
                },
                {
                    critere: "Traitement et recentrage sur la valeur",
                    preuvesAttendues: "Réponse argumentée recentrée sur le bénéfice prospect.",
                    points: "3/5",
                    preuvesObservees: [
                        {
                            quote: "Justement, l'idée c'est de partir de vos priorités, pas d'un catalogue.",
                            speaker: "Apprenant",
                            time: "19:15:52",
                        },
                    ],
                    analyse: "Recentrage pertinent sur les besoins, à appuyer par une preuve concrète.",
                    conseils: "Ajoutez un exemple chiffré ou un cas similaire pour renforcer la réponse.",
                    verbatim: "Pour un acteur comme vous, cela représente concrètement [bénéfice mesurable].",
                },
            ],
        },
        {
            number: 4,
            title: "Obtenir le rendez-vous",
            icon: "check",
            score: 93,
            status: "À maintenir",
            total: "18.5/20",
            commentaireCoach:
                "La conclusion est efficace : le rendez-vous est sécurisé avec un format et un créneau clairs. L'engagement réciproque est bien posé.",
            criteresReussis: [
                "Rendez-vous sécurisé avec créneau et format précis",
                "Récapitulatif clair de l'objectif du prochain échange",
            ],
            criteresAAmeliorer: ["Confirmer par écrit immédiatement après l'appel"],
            stepTranscript: {
                start: "03:29",
                end: "04:10",
                lines: [
                    {
                        speaker: "you",
                        text: "Je vous propose qu'on se cale 30 minutes en visio jeudi à 10h pour formaliser le plan, ça vous convient ?",
                    },
                    { speaker: "persona", text: "Oui, jeudi 10h c'est parfait." },
                ],
            },
            reformulations: [
                {
                    original: "Je vous rappelle pour fixer un rendez-vous.",
                    suggestion:
                        "Je vous envoie tout de suite une invitation visio de 30 minutes jeudi 10h avec l'ordre du jour — vous confirmez ?",
                    pourquoi: "Verrouille le RDV (canal, durée, créneau) et déclenche une confirmation immédiate.",
                },
            ],
            criteria: [
                {
                    critere: "Proposition d'un créneau précis",
                    preuvesAttendues: "Proposition de deux créneaux datés et concrets.",
                    points: "5/5",
                    preuvesObservees: [
                        {
                            quote: "Seriez-vous disponible mardi à 9h ou jeudi à 14h ?",
                            speaker: "Apprenant",
                            time: "19:17:10",
                        },
                    ],
                    analyse: "Créneaux proposés clairement, facilitant la décision du prospect.",
                    conseils: "Continuez à proposer un choix limité de créneaux datés.",
                    verbatim: "Je vous propose mardi 9h ou jeudi 14h — lequel vous arrange ?",
                },
                {
                    critere: "Verrouillage et confirmation",
                    preuvesAttendues: "Confirmation du format, du créneau et de l'adresse mail.",
                    points: "5/5",
                    preuvesObservees: [
                        {
                            quote: "Parfait, je vous envoie une invitation par mail pour confirmer.",
                            speaker: "Apprenant",
                            time: "19:17:34",
                        },
                    ],
                    analyse: "Engagement sécurisé et confirmé, conclusion claire et rassurante.",
                    conseils: "Maintenez ce réflexe de verrouillage systématique en fin d'échange.",
                    verbatim: "Je vous envoie l'invitation à [email] — vous me confirmez la bonne réception ?",
                },
            ],
        },
    ],
    discourse: [
        { title: "Temps de parole", value: "61%", subtitle: "Recommandé: 30 à 40", reco: "warn" },
        { title: "Talk-to-Listen Ratio", value: "1.56%" },
        { title: "Taux de monologue", value: "45%" },
        { title: "Débit de parole", value: "182 mots/min", subtitle: "Recommandé: 130 à 170", reco: "warn" },
        { title: "Taux d'interruption", value: "0" },
        { title: "Temps de latence", value: "1.1s" },
        {
            title: "Mots positifs vs négatifs",
            value: "9 / 1",
            subtitle: "9 mots positifs, 1 mots négatifs",
        },
        { title: "Questions ouvertes vs fermées", value: "4 / 2", subtitle: "4 ouvertes, 2 fermées" },
        { title: "Béquilles de langage", value: "2", subtitle: "en fait (1x), du coup (1x)" },
    ],
    transcript: [
        { speaker: "persona", time: "0:00", text: "Oui allô, Rachid Hamrani à l'appareil, c'est à quel sujet ?" },
        { speaker: "you", time: "0:00", text: "Oui allô." },
        {
            speaker: "you",
            time: "0:05",
            text: "Oui, bonjour, je cherche à rejoindre Richard Amrani, s'il vous plaît.",
        },
        { speaker: "persona", time: "0:05", text: "Oui allô, Rachid Hamrani à l'appareil, c'est à quel sujet ?" },
        { speaker: "persona", time: "0:12", text: "Bonjour, je vous écoute" },
        {
            speaker: "you",
            time: "0:14",
            text: "Oui, bonjour M. Amrani, c'est Paul Laverdure de la Société Générale.",
        },
        {
            speaker: "you",
            time: "0:20",
            text: "Au centre d'affaires à la défense, je me permets de vous appeler de la part de Stéphane Dubois qui est un de vos clients, société Satec.",
        },
    ],
};
