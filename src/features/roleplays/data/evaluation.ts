export type StepStatus = "À renforcer" | "À consolider" | "À maintenir";

export interface EvaluationCriterion {
    critere: string;
    preuvesAttendues: string;
    points: string;
    preuvesObservees: { quote: string; speaker: string; time: string }[];
    analyse: string;
    conseils: string;
    verbatim: string;
}

export interface EvaluationStep {
    number: number;
    title: string;
    icon: "phone" | "message" | "shield" | "check";
    score: number;
    status: StepStatus;
    total: string;
    criteria: EvaluationCriterion[];
}

export interface DiscourseMetric {
    title: string;
    value: string;
    subtitle?: string;
    reco?: "ok" | "warn";
}

export interface TranscriptMessage {
    speaker: "you" | "persona";
    time: string;
    text: string;
}

export interface Evaluation {
    personaAvis: string;
    coachAppreciation: string;
    pointsPositifs: string[];
    axesAmelioration: string[];
    prioriteStrategique: string;
    planEtape: { number: number; title: string; text: string };
    steps: EvaluationStep[];
    discourse: DiscourseMetric[];
    transcript: TranscriptMessage[];
}

export const stepStatusStyles: Record<StepStatus, { bg: string; text: string }> = {
    "À renforcer": { bg: "#FEF2F2", text: "#DC2626" },
    "À consolider": { bg: "#FFF7ED", text: "#C2410C" },
    "À maintenir": { bg: "#F0FDF4", text: "#16A34A" },
};

export const evaluation: Evaluation = {
    personaAvis:
        "J'ai ressenti une prise de contact professionnelle et respectueuse de mon temps. Après un début un peu large, la discussion a rapidement été orientée sur mes priorités (poste client, BFR) et la proposition de valeur s'est clarifiée. Je me suis senti écouté et le dialogue était centré sur mes besoins réels. La confirmation du rendez-vous était efficace et rassurante, ce qui m'a donné confiance pour accepter l'échange.",
    coachAppreciation:
        "L'appel démontre une maîtrise de la relation, une écoute active et une forte orientation client. Après une ouverture perfectible, l'échange bascule sur une vraie co-construction, la gestion des objections est saine et l'engagement obtenu est sécurisé et clair. Professionnalisme, réactivité et structuration générale ressortent nettement.",
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
