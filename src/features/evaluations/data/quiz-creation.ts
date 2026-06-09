export const QUIZ_TYPES = [
    "Quiz de Connaissance",
    "Quiz d'Auto-Positionnement",
    "QCM",
] as const;

export type QuizType = (typeof QUIZ_TYPES)[number];

export const QUIZ_QUESTION_TYPES = [
    { value: "QCU", label: "QCU (choix unique)" },
    { value: "QCM", label: "QCM (choix multiples)" },
] as const;

export type QuizQuestionTypeValue = (typeof QUIZ_QUESTION_TYPES)[number]["value"];

export const QUIZ_VISIBILITY_OPTIONS = [
    {
        value: "public",
        title: "Public (Maia Coach)",
        description: "Visible par tous les utilisateurs de la plateforme",
    },
    {
        value: "private",
        title: "Privé",
        description: "Visible uniquement par une cible spécifique (organisation, groupe ou utilisateur)",
    },
] as const;

export type QuizVisibility = (typeof QUIZ_VISIBILITY_OPTIONS)[number]["value"];

export const QUIZ_ASSIGNMENT_TYPES = [
    { value: "organization", label: "Organisation" },
    { value: "group", label: "Groupe" },
    { value: "user", label: "Utilisateur" },
] as const;

export type QuizAssignmentType = (typeof QUIZ_ASSIGNMENT_TYPES)[number]["value"];

export const QUIZ_PARTICIPATION_OPTIONS = [
    {
        value: "optional",
        title: "Optionnel",
        description: "Les apprenants peuvent choisir de faire ce quiz",
    },
    {
        value: "mandatory",
        title: "Obligatoire",
        description: "Les apprenants doivent compléter ce quiz pour valider leur niveau",
    },
] as const;

export type QuizParticipation = (typeof QUIZ_PARTICIPATION_OPTIONS)[number]["value"];

export interface QuizAnswerDraft {
    id: string;
    text: string;
    correct: boolean;
}

export interface QuizQuestionDraft {
    id: string;
    prompt: string;
    type: QuizQuestionTypeValue;
    answers: QuizAnswerDraft[];
    explanation: string;
}

export interface QuizCategoryDraft {
    id: string;
    name: string;
    collapsed: boolean;
    questions: QuizQuestionDraft[];
}

export interface CreateQuizFormValues {
    title: string;
    type: QuizType;
    methodId: string;
    description: string;
    durationMinutes: number;
    tags: string[];
    visibility: QuizVisibility;
    /** Type de cible — uniquement utilisé quand `visibility = "private"`. Vide tant que rien n'est sélectionné. */
    assignmentType: QuizAssignmentType | "";
    /** Identifiant de la cible (org/groupe/utilisateur) — vide tant que rien n'est sélectionné. */
    assignmentTargetId: string;
    /** Organisation parente — utilisée pour filtrer les groupes/utilisateurs disponibles. */
    assignmentParentOrgId: string;
    participation: QuizParticipation;
    categories: QuizCategoryDraft[];
}

let idCounter = 0;
function nextId(prefix: string) {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
}

export function createEmptyAnswer(): QuizAnswerDraft {
    return { id: nextId("answer"), text: "", correct: false };
}

export function createEmptyQuestion(): QuizQuestionDraft {
    return {
        id: nextId("question"),
        prompt: "",
        type: "QCU",
        answers: [createEmptyAnswer(), createEmptyAnswer(), createEmptyAnswer(), createEmptyAnswer()],
        explanation: "",
    };
}

export function createEmptyCategory(): QuizCategoryDraft {
    return {
        id: nextId("category"),
        name: "",
        collapsed: false,
        questions: [],
    };
}

export function getInitialCreateQuizForm(): CreateQuizFormValues {
    return {
        title: "",
        type: "Quiz de Connaissance",
        methodId: "",
        description: "",
        durationMinutes: 30,
        tags: [],
        visibility: "public",
        assignmentType: "",
        assignmentTargetId: "",
        assignmentParentOrgId: "",
        participation: "optional",
        categories: [],
    };
}
