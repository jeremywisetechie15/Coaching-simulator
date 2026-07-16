import type { MethodStepIcon } from "@/features/methods/domain/method";

export type { MethodStepIcon } from "@/features/methods/domain/method";

export interface MethodStep {
    id?: string;
    title: string;
    icon: MethodStepIcon;
    summary: string;
    capsule: { title: string; duration: string };
    objectifs: string[];
    bonnesPratiques: string[];
    erreurs: string[];
    posture: string[];
    verbatims: string[];
}

export interface MethodMiniStep {
    title: string;
    text: string;
}

export interface Method {
    id: string;
    name: string;
    subtitle: string;
    category: string;
    description: string;
    readingTime: string;
    quizQuestions: number;
    retenir: MethodMiniStep[];
    objectifs: string[];
    enjeux: string[];
    objectifMetier: string;
    steps: MethodStep[];
}

const dagoSteps: MethodStep[] = [
    {
        title: "Démarrer l'appel et passer le barrage du standard",
        icon: "phone",
        summary: "Passer le barrage du standard ou de l'assistant(e) pour accéder au décideur",
        capsule: { title: "Méthode DAGO: Démarrer l'appel", duration: "4:49" },
        objectifs: [
            "Accéder au bon interlocuteur sans déclencher un refus réflexe",
            "Être perçu comme légitime, professionnel, efficace",
            "Obtenir : transfert, meilleur créneau, ou alternative (mail direct / autre contact)",
        ],
        bonnesPratiques: [
            "Préparer : nom/prénom du décideur, fonction, orthographe, motif d'appel en 1 phrase, objectif (transfert vs rappel)",
            "Formule courte : Nom + société + demande de mise en relation (7–10 mots)",
            "Question orientée action : « Vous pouvez me le passer ? »",
            "Réponse courte et immédiate à l'objection « C'est à quel sujet ? »",
            "Prévoir des issues : transfert / rappel à heure précise / mail direct / bon contact",
        ],
        erreurs: [
            "Être flou (« au sujet de… ») ou trop long",
            "Motif trop commercial (« présenter nos services ») qui déclenche le filtre",
            "Insistance ou irritation",
        ],
        posture: [
            "Posture « agenda-friendly » : respect du temps, ton calme, efficacité",
            "Communication factuelle et polie, sans justification",
            "Standard considéré comme partenaire de routage",
        ],
        verbatims: [
            "« Bonjour, je suis [Prénom Nom] de [Société]. Je souhaiterais parler à [Prénom Décideur], vous pouvez me le passer ? »",
            "« C'est au sujet d'une optimisation de [thématique pertinente]. Vous pouvez me transférer ? »",
            "« Quel serait le meilleur moment pour le rappeler aujourd'hui ? »",
            "« Sinon, quelle serait la meilleure personne à contacter sur ce sujet ? »",
        ],
    },
    {
        title: "Se présenter et accrocher le prospect",
        icon: "message",
        summary: "Se présenter avec légitimité et capter l'intérêt du prospect en quelques secondes",
        capsule: { title: "Méthode DAGO: Accrocher le prospect", duration: "5:12" },
        objectifs: [
            "Installer rapidement légitimité et pertinence",
            "Créer une raison d'écouter centrée sur le prospect",
            "Obtenir l'autorisation de poursuivre l'échange",
        ],
        bonnesPratiques: [
            "Présentation courte : qui vous êtes et pourquoi cet appel a du sens pour le prospect",
            "Accroche centrée sur un enjeu ou un signal métier observable",
            "Poser une question d'intérêt qui engage tôt dans l'échange",
            "Annoncer la durée et le cadre de l'échange",
        ],
        erreurs: [
            "Ouvrir sur un pitch produit ou un catalogue de services",
            "Rester générique et ne pas contextualiser au prospect",
            "Monologuer sans laisser le prospect réagir",
        ],
        posture: [
            "Ton assuré et orienté valeur, pas commercial agressif",
            "Écoute active dès les premières secondes",
            "Centrage permanent sur les enjeux du prospect",
        ],
        verbatims: [
            "« J'ai vu que [signal] — c'est précisément le sujet sur lequel je voulais échanger avec vous. »",
            "« Sur [enjeu métier], où en êtes-vous aujourd'hui ? »",
            "« Je vous propose un échange court, le temps de voir s'il y a matière à aller plus loin. »",
        ],
    },
    {
        title: "Gérer les objections du prospect",
        icon: "shield",
        summary: "Traiter les objections calmement et recentrer sur la valeur pour le prospect",
        capsule: { title: "Méthode DAGO: Gérer les objections", duration: "6:03" },
        objectifs: [
            "Accueillir l'objection sans posture défensive",
            "Comprendre le frein réel derrière l'objection",
            "Recentrer l'échange sur le bénéfice concret",
        ],
        bonnesPratiques: [
            "Reformuler l'objection et la faire confirmer avant d'y répondre",
            "Répondre de façon courte, factuelle et orientée bénéfice",
            "Appuyer la réponse par un exemple ou un cas similaire",
            "Revenir vers la demande d'action une fois l'objection levée",
        ],
        erreurs: [
            "Répondre trop vite, avant d'avoir compris l'objection",
            "Argumenter de façon défensive ou se justifier longuement",
            "Laisser l'objection sans conclusion ni recentrage",
        ],
        posture: [
            "Calme, ouverture et écoute face à l'objection",
            "Considérer l'objection comme un signal d'intérêt",
            "Maintenir le cap vers l'objectif de l'appel",
        ],
        verbatims: [
            "« Si je vous suis bien, votre point c'est [reformulation] — c'est ça ? »",
            "« Justement, l'idée est de partir de vos priorités, pas d'un catalogue. »",
            "« Pour un acteur comme vous, cela représente concrètement [bénéfice mesurable]. »",
        ],
    },
    {
        title: "Conclure l'appel et Obtenir un Rendez-Vous",
        icon: "check",
        summary: "Fixer un rendez-vous clair, daté et sécurisé pour éviter le no-show",
        capsule: { title: "Méthode DAGO: Obtenir le rendez-vous", duration: "4:27" },
        objectifs: [
            "Transformer l'intérêt en engagement concret",
            "Fixer un rendez-vous daté, cadré et qualifié",
            "Sécuriser la présence et limiter les annulations",
        ],
        bonnesPratiques: [
            "Proposer un choix limité de deux créneaux datés",
            "Confirmer le format, la durée et les participants",
            "Verrouiller l'adresse mail et envoyer une invitation agenda",
            "Récapituler l'objectif du rendez-vous en une phrase",
        ],
        erreurs: [
            "Laisser un rendez-vous flou (« on se rappelle »)",
            "Oublier de confirmer le créneau par écrit",
            "Ne pas reformuler l'objet du rendez-vous",
        ],
        posture: [
            "Affirmer le créneau avec assurance et clarté",
            "Réflexe systématique de verrouillage en fin d'échange",
            "Ton rassurant qui sécurise l'engagement",
        ],
        verbatims: [
            "« Je vous propose mardi 9h ou jeudi 14h — lequel vous arrange ? »",
            "« Je vous envoie l'invitation à [email] — vous me confirmez la bonne réception ? »",
            "« L'objectif de notre échange : [objectif en une phrase]. »",
        ],
    },
];

const fourCSteps: MethodStep[] = [
    {
        title: "Contact : créer le lien et cadrer l'échange",
        icon: "phone",
        summary: "Établir un climat de confiance et cadrer clairement l'échange",
        capsule: { title: "Méthode 4C: Contact", duration: "4:10" },
        objectifs: [
            "Créer un climat de confiance dès les premières secondes",
            "Annoncer le cadre, la durée et l'objectif de l'échange",
            "Obtenir l'accord du prospect pour avancer",
        ],
        bonnesPratiques: [
            "Présentation courte et chaleureuse",
            "Annoncer l'ordre du jour et la durée",
            "Vérifier la disponibilité réelle de l'interlocuteur",
        ],
        erreurs: ["Entrer directement dans le vif sans cadrer", "Négliger la mise en confiance"],
        posture: ["Ton ouvert et professionnel", "Écoute et respect du temps de l'autre"],
        verbatims: [
            "« Je vous propose qu'on prenne [durée] pour [objectif] — cela vous convient ? »",
        ],
    },
    {
        title: "Connaître : découvrir les besoins",
        icon: "message",
        summary: "Explorer la situation et les besoins réels du prospect",
        capsule: { title: "Méthode 4C: Connaître", duration: "5:30" },
        objectifs: [
            "Comprendre la situation, les enjeux et les besoins",
            "Faire émerger les priorités du prospect",
            "Qualifier le contexte de décision",
        ],
        bonnesPratiques: [
            "Poser des questions ouvertes",
            "Pratiquer l'écoute active et la reformulation",
            "Creuser les enjeux derrière les besoins exprimés",
        ],
        erreurs: ["Présenter avant d'avoir découvert", "Enchaîner les questions sans écouter"],
        posture: ["Curiosité sincère", "Écoute centrée sur le prospect"],
        verbatims: ["« Comment gérez-vous aujourd'hui [thématique] ? »"],
    },
    {
        title: "Convaincre : argumenter par la valeur",
        icon: "shield",
        summary: "Construire une argumentation centrée sur la valeur pour le prospect",
        capsule: { title: "Méthode 4C: Convaincre", duration: "5:55" },
        objectifs: [
            "Relier l'offre aux besoins identifiés",
            "Démontrer la valeur concrète et mesurable",
            "Traiter les objections avec sérénité",
        ],
        bonnesPratiques: [
            "Argumenter en bénéfices, pas en caractéristiques",
            "Appuyer par des preuves et des cas concrets",
            "Reformuler et traiter les objections",
        ],
        erreurs: ["Dérouler un pitch produit générique", "Ignorer les objections"],
        posture: ["Confiance et clarté", "Orientation valeur permanente"],
        verbatims: ["« Concrètement, pour vous, cela représente [bénéfice]. »"],
    },
    {
        title: "Conclure : engager et verrouiller",
        icon: "check",
        summary: "Obtenir un engagement clair et définir les prochaines étapes",
        capsule: { title: "Méthode 4C: Conclure", duration: "4:05" },
        objectifs: [
            "Transformer l'intérêt en engagement",
            "Définir des prochaines étapes claires",
            "Sécuriser le suivi",
        ],
        bonnesPratiques: [
            "Proposer une étape suivante concrète et datée",
            "Récapituler les points d'accord",
            "Confirmer par écrit",
        ],
        erreurs: ["Laisser l'échange sans conclusion", "Oublier de fixer la suite"],
        posture: ["Assurance dans la conclusion", "Réflexe de verrouillage"],
        verbatims: ["« On se cale [prochaine étape] pour [date] — je vous confirme par mail. »"],
    },
];

const acdcSteps: MethodStep[] = [
    {
        title: "Accueillir : ouvrir l'entretien",
        icon: "phone",
        summary: "Ouvrir l'entretien commercial et installer un climat favorable",
        capsule: { title: "Méthode ACDC: Accueillir", duration: "4:20" },
        objectifs: [
            "Créer un climat positif et professionnel",
            "Donner envie au prospect d'échanger",
            "Poser le cadre de l'entretien",
        ],
        bonnesPratiques: [
            "Soigner les premières secondes de l'échange",
            "Annoncer le déroulé et la durée",
            "Obtenir un premier accord de principe",
        ],
        erreurs: ["Ouverture trop froide ou trop longue", "Absence de cadrage"],
        posture: ["Chaleur et professionnalisme", "Disponibilité et écoute"],
        verbatims: ["« Merci de me recevoir — je vous propose qu'on commence par [cadre]. »"],
    },
    {
        title: "Cadrer : aligner les attentes",
        icon: "message",
        summary: "Aligner les attentes et structurer l'entretien commercial",
        capsule: { title: "Méthode ACDC: Cadrer", duration: "5:00" },
        objectifs: [
            "Clarifier les attentes réciproques",
            "Structurer l'entretien autour d'objectifs partagés",
            "Obtenir l'accord sur le déroulé",
        ],
        bonnesPratiques: [
            "Reformuler le contexte et l'objectif de la rencontre",
            "Valider l'ordre du jour avec le prospect",
            "Annoncer la prochaine étape de l'entretien",
        ],
        erreurs: ["Avancer sans cadre partagé", "Imposer son agenda sans valider"],
        posture: ["Clarté et structure", "Co-construction du cadre"],
        verbatims: ["« Si je résume, votre attente c'est [attente] — on part là-dessus ? »"],
    },
    {
        title: "Découvrir : explorer les besoins",
        icon: "shield",
        summary: "Découvrir en profondeur les besoins, enjeux et freins du prospect",
        capsule: { title: "Méthode ACDC: Découvrir", duration: "6:15" },
        objectifs: [
            "Explorer les besoins et les enjeux en profondeur",
            "Identifier les freins et les motivations d'achat",
            "Qualifier le processus de décision",
        ],
        bonnesPratiques: [
            "Questionnement consultatif et progressif",
            "Écoute active et reformulation",
            "Faire émerger les impacts et les priorités",
        ],
        erreurs: ["Découverte superficielle", "Passer à la proposition trop tôt"],
        posture: ["Posture de conseil", "Curiosité et écoute"],
        verbatims: ["« Quel impact cela a-t-il aujourd'hui sur [activité] ? »"],
    },
    {
        title: "Confirmer : valider et engager",
        icon: "check",
        summary: "Valider le diagnostic partagé et engager le prospect vers la suite",
        capsule: { title: "Méthode ACDC: Confirmer", duration: "4:40" },
        objectifs: [
            "Valider le diagnostic avec le prospect",
            "Obtenir un accord pour avancer",
            "Définir des prochaines étapes claires",
        ],
        bonnesPratiques: [
            "Reformuler le diagnostic et le faire valider",
            "Proposer une étape suivante concrète",
            "Confirmer les engagements par écrit",
        ],
        erreurs: ["Conclure sans valider le diagnostic", "Prochaine étape floue"],
        posture: ["Assurance et clarté", "Engagement réciproque"],
        verbatims: ["« On est bien d'accord sur [diagnostic] — je vous propose [étape suivante]. »"],
    },
];

export const methods: Method[] = [
    {
        id: "dago",
        name: "Méthode DAGO",
        subtitle: "Méthode de prise de rendez-vous",
        category: "Commercial",
        description:
            "La prise de rendez-vous B2B vise à obtenir un échange qualifié avec un décideur en créant rapidement légitimité, pertinence et valeur perçue. La méthode DAGO structure l'appel en 4 étapes mémorisables pour : accéder au bon interlocuteur, installer l'intérêt, lever les objections, puis fixer un rendez-vous clair et sécurisé. DAGO signifie: D — Démarrer et passer le barrage (standard / secrétaire) A — Accrocher (se présenter + capter l'intérêt du prospect) G — Gérer (les objections) O — Obtenir (le rendez-vous : conclure et fixer)",
        readingTime: "12 min",
        quizQuestions: 12,
        retenir: [
            { title: "Démarrer", text: "Passer le barrage du standard" },
            { title: "Accrocher", text: "Capter l'intérêt du prospect" },
            { title: "Gérer", text: "Traiter les objections calmement" },
            { title: "Obtenir", text: "Fixer un rendez-vous qualifié" },
        ],
        objectifs: [
            "Augmenter le taux appel → rendez-vous",
            "Obtenir des rendez-vous qualifiés",
            "Sortir du \"pitch produit\" pour adopter une logique enjeux/valeur",
        ],
        enjeux: [
            "Passer le barrage standard / assistant(e)",
            "Gérer des prospects sur-sollicités et sceptiques",
            "Réduire les rendez-vous flous et les annulations (no-show)",
        ],
        objectifMetier: "Prise de rendez-vous prospect qualifié",
        steps: dagoSteps,
    },
    {
        id: "4c",
        name: "Méthode 4C",
        subtitle: "Méthode opérationnelle en 4 étapes (4C)",
        category: "Management",
        description:
            "La méthode 4C structure l'entretien commercial en 4 temps clairs — Contact, Connaître, Convaincre, Conclure — pour conduire un échange centré sur le client, de la mise en confiance jusqu'à l'engagement. Elle aide à découvrir les besoins réels avant d'argumenter et à transformer l'intérêt en décision concrète.",
        readingTime: "10 min",
        quizQuestions: 10,
        retenir: [
            { title: "Contact", text: "Créer le lien et cadrer" },
            { title: "Connaître", text: "Découvrir les besoins" },
            { title: "Convaincre", text: "Argumenter par la valeur" },
            { title: "Conclure", text: "Engager et verrouiller" },
        ],
        objectifs: [
            "Structurer chaque entretien commercial",
            "Découvrir les besoins avant d'argumenter",
            "Transformer l'intérêt en engagement",
        ],
        enjeux: [
            "Éviter les entretiens décousus ou centrés produit",
            "Gérer des interlocuteurs aux attentes variées",
            "Sécuriser des prochaines étapes claires",
        ],
        objectifMetier: "Conduite d'entretien commercial",
        steps: fourCSteps,
    },
    {
        id: "acdc",
        name: "Méthode ACDC",
        subtitle: "Méthode d'entretien commercial B2B",
        category: "Management",
        description:
            "La méthode ACDC structure l'entretien commercial B2B en 4 étapes — Accueillir, Cadrer, Découvrir, Confirmer — pour mener une découverte approfondie et un échange consultatif. Elle privilégie l'alignement des attentes et la validation d'un diagnostic partagé avant tout engagement.",
        readingTime: "11 min",
        quizQuestions: 12,
        retenir: [
            { title: "Accueillir", text: "Ouvrir l'entretien" },
            { title: "Cadrer", text: "Aligner les attentes" },
            { title: "Découvrir", text: "Explorer les besoins" },
            { title: "Confirmer", text: "Valider et engager" },
        ],
        objectifs: [
            "Mener un entretien B2B consultatif",
            "Approfondir la découverte des besoins",
            "Valider un diagnostic partagé avant de conclure",
        ],
        enjeux: [
            "Aligner les attentes en début d'entretien",
            "Conduire une découverte en profondeur",
            "Sécuriser l'engagement sur un diagnostic validé",
        ],
        objectifMetier: "Entretien commercial B2B",
        steps: acdcSteps,
    },
];
