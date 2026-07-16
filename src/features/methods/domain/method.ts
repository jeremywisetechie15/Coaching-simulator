import {
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    ORGANIZATION_CONTENT_VISIBILITY_SCOPES,
    type ContentStatus,
    type OrganizationContentVisibilityScope,
} from "@/features/content/domain";

function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const METHOD_ROUTES = {
    api: {
        collection: "/api/methods",
        detail: (methodId: string) => `/api/methods/${encodeRouteSegment(methodId)}`,
        duplicate: (methodId: string) => `/api/methods/${encodeRouteSegment(methodId)}/duplicate`,
        resource: (methodId: string, resourceId: string) =>
            `/api/methods/${encodeRouteSegment(methodId)}/resources/${encodeRouteSegment(resourceId)}`,
    },
    app: {
        collection: "/methods",
        detail: (methodId: string) => `/methods/${encodeRouteSegment(methodId)}`,
        edit: (methodId: string) => `/methods/${encodeRouteSegment(methodId)}/edit`,
    },
} as const;

export const METHOD_SCOPE = {
    organization: CONTENT_VISIBILITY_SCOPE.organization,
    public: CONTENT_VISIBILITY_SCOPE.public,
} as const;

export const METHOD_SCOPES = ORGANIZATION_CONTENT_VISIBILITY_SCOPES;

export type MethodScope = OrganizationContentVisibilityScope;

export const METHOD_SCOPE_LABELS: Record<MethodScope, string> = {
    [METHOD_SCOPE.organization]: CONTENT_VISIBILITY_SCOPE_LABELS.organization,
    [METHOD_SCOPE.public]: CONTENT_VISIBILITY_SCOPE_LABELS.public,
};

export function getMethodScopeLabel(method: {
    organizationName?: string | null;
    scope: MethodScope;
}) {
    if (method.scope === METHOD_SCOPE.organization && method.organizationName) {
        return `Privé - ${method.organizationName}`;
    }

    return METHOD_SCOPE_LABELS[method.scope];
}

export function formatMethodMasteryDate(value: string | null | undefined) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Europe/Paris",
        year: "numeric",
    }).format(date);
}

export const METHOD_MASTERY_TREND = {
    down: "down",
    initial: "initial",
    stable: "stable",
    up: "up",
} as const;

export type MethodMasteryTrend = (typeof METHOD_MASTERY_TREND)[keyof typeof METHOD_MASTERY_TREND];

export interface MethodMastery {
    completedAt: string | null;
    delta: number | null;
    scorePercent: number;
    trend: MethodMasteryTrend;
}

export function getMethodMasteryLabel(
    hasAssociatedQuiz: boolean,
    mastery: Pick<MethodMastery, "scorePercent"> | null,
) {
    if (!hasAssociatedQuiz) return "Aucun quiz associé";
    if (!mastery) return "Non testée";

    return `${Math.round(mastery.scorePercent)}%`;
}

export function calculateMethodMasteryTrend(latestScore: number, previousScore: number | null) {
    if (previousScore === null) {
        return { delta: null, trend: METHOD_MASTERY_TREND.initial } as const;
    }

    const delta = Math.round(latestScore - previousScore);

    if (delta > 0) return { delta, trend: METHOD_MASTERY_TREND.up } as const;
    if (delta < 0) return { delta, trend: METHOD_MASTERY_TREND.down } as const;

    return { delta: 0, trend: METHOD_MASTERY_TREND.stable } as const;
}

export interface MethodOrganizationOption {
    id: string;
    name: string;
}

export interface MethodSelectionOption {
    id: string;
    name: string;
}

/** All method selectors display the canonical method name, never its code. */
export function getMethodSelectionLabel(method: Pick<MethodSelectionOption, "name">) {
    return method.name;
}

export function toMethodSelectOption(method: MethodSelectionOption) {
    return {
        label: getMethodSelectionLabel(method),
        value: method.id,
    };
}

/**
 * Canonical catalogue for method-step icons.
 *
 * Persistence, validation and every method-step icon picker derive from these
 * stable values so a label is never used as an API identifier.
 */
export const METHOD_STEP_ICON_LABELS = {
    phone: "Téléphone",
    message: "Message",
    ear: "Écoute",
    question: "Questions",
    presentation: "Présentation",
    handshake: "Accord",
    users: "Collaboration",
    search: "Découverte",
    target: "Objectif",
    compass: "Orientation",
    lightbulb: "Idée",
    brain: "Réflexion",
    pen: "Préparation",
    plan: "Plan d’action",
    calendar: "Planification",
    clock: "Gestion du temps",
    send: "Suivi",
    repeat: "Relance",
    flag: "Jalon",
    briefcase: "Enjeu métier",
    euro: "Budget",
    scale: "Décision",
    puzzle: "Solution",
    shield: "Bouclier",
    check: "Coche",
    gauge: "Performance",
    trophy: "Réussite",
    zap: "Impact",
} as const;

export type MethodStepIcon = keyof typeof METHOD_STEP_ICON_LABELS;

export const METHOD_STEP_ICONS = Object.keys(METHOD_STEP_ICON_LABELS) as [
    MethodStepIcon,
    ...MethodStepIcon[],
];

export const DEFAULT_METHOD_STEP_ICON = "phone" satisfies MethodStepIcon;

export function isMethodStepIcon(value: unknown): value is MethodStepIcon {
    return typeof value === "string" && Object.hasOwn(METHOD_STEP_ICON_LABELS, value);
}

export function normalizeMethodStepIcon(value: unknown): MethodStepIcon {
    return isMethodStepIcon(value) ? value : DEFAULT_METHOD_STEP_ICON;
}

export const METHOD_RESOURCE_TYPES = ["link", "document", "video", "audio", "image"] as const;

export type MethodResourceType = (typeof METHOD_RESOURCE_TYPES)[number];

export const METHOD_RESOURCE_TYPE_LABELS: Record<MethodResourceType, string> = {
    audio: "Audio",
    document: "Document",
    image: "Image",
    link: "URL",
    video: "Vidéo",
};

export const METHOD_RESOURCE_TYPE_BY_FORM_LABEL: Record<string, MethodResourceType> = {
    Audio: "audio",
    Document: "document",
    Image: "image",
    PDF: "document",
    URL: "link",
    Vidéo: "video",
};

export interface MethodResource {
    durationSeconds: number | null;
    externalUrl: string;
    id: string;
    label: string;
    notationFileId: string | null;
    resourceType: MethodResourceType;
    sortOrder: number;
    stepId: string | null;
    storageBucket: string | null;
    storagePath: string | null;
}

export interface MethodStepItem {
    bestPractices: string[];
    code: string;
    icon: MethodStepIcon;
    id: string;
    objectives: string[];
    order: number;
    pitfalls: string[];
    posture: string[];
    resources: MethodResource[];
    shortTitle: string;
    stepKey: string;
    summary: string;
    takeaway: string;
    title: string;
    verbatims: string[];
    weight: number | null;
}

export const METHOD_STEP_SECTION = {
    bestPractices: "bestPractices",
    objectives: "objectives",
    pitfalls: "pitfalls",
    posture: "posture",
    verbatims: "verbatims",
} as const;

export type MethodStepSection = (typeof METHOD_STEP_SECTION)[keyof typeof METHOD_STEP_SECTION];

export const METHOD_STEP_SECTION_LABELS: Record<MethodStepSection, string> = {
    [METHOD_STEP_SECTION.objectives]: "Objectifs et enjeux",
    [METHOD_STEP_SECTION.bestPractices]: "Bonnes pratiques",
    [METHOD_STEP_SECTION.pitfalls]: "Écueils à éviter",
    [METHOD_STEP_SECTION.posture]: "Posture & Communication",
    [METHOD_STEP_SECTION.verbatims]: "Verbatims préconisés",
};

export interface MethodListItem {
    category: string;
    code: string;
    description: string;
    domain: string;
    id: string;
    name: string;
    organizationId: string | null;
    organizationName: string | null;
    readingTimeLabel: string;
    readingTimeMinutes: number | null;
    scope: MethodScope;
    status: ContentStatus;
    stepCount: number;
    subtitle: string;
    tag: string;
    version: string;
}

export interface MethodDetail extends MethodListItem {
    challenges: string[];
    notationMethodId: string | null;
    objectives: string[];
    resources: MethodResource[];
    steps: MethodStepItem[];
}
