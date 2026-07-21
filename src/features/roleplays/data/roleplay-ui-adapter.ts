import { methods, type Method, type MethodStep } from "@/features/methods/data/methods";
import type { MethodDetail, MethodStepItem } from "@/features/methods/domain/method";
import { EVALUATION_ROUTES, getQuizTypeLabel } from "@/features/evaluations/domain";
import { ROLEPLAY_ROUTES, type RoleplayDetail as DbRoleplayDetail, type RoleplayListItem } from "@/features/roleplays/domain";
import { getStoragePathFileName } from "@/lib/uploads/content-upload";
import type { PrepDocument, PrepQuiz, PrepResourceKind } from "./preparation";
import { roleplays, type RoleplayDetail as UiRoleplayDetail, type RoleplayItem } from "./roleplays";

function normalize(value: string | null | undefined) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function hasText(value: string | null | undefined): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function textOrMock(value: string | null | undefined, fallback: string) {
    return hasText(value) ? value.trim() : fallback;
}

function listOrMock(values: string[], fallback: string[]) {
    return values.length > 0 ? values : fallback;
}

function getPrepDocumentKind(resource: DbRoleplayDetail["resources"][number]): PrepResourceKind {
    if (resource.resourceType === "link") return "article";
    if (resource.resourceType === "video" || resource.resourceType === "image" || resource.resourceType === "audio") {
        return resource.resourceType;
    }

    const fileName = `${resource.storagePath ?? ""} ${resource.label}`.toLowerCase();
    return fileName.includes(".pdf") ? "pdf" : "document";
}

function getPrepDocumentMeta(resource: DbRoleplayDetail["resources"][number]) {
    if (resource.externalUrl) return "URL";
    if (resource.storagePath) return getStoragePathFileName(resource.storagePath);
    return undefined;
}

function getPrepDocumentUrl(roleplayId: string, resource: DbRoleplayDetail["resources"][number]) {
    if (resource.resourceType === "video" && resource.externalUrl) {
        return resource.externalUrl;
    }

    return resource.externalUrl || (resource.storageBucket && resource.storagePath)
        ? ROLEPLAY_ROUTES.api.resource(roleplayId, resource.id)
        : undefined;
}

function mapDbResourcesToPrepDocuments(roleplay: DbRoleplayDetail): PrepDocument[] {
    return roleplay.resources.map((resource) => ({
        id: resource.id,
        kind: getPrepDocumentKind(resource),
        meta: getPrepDocumentMeta(resource),
        title: resource.label,
        url: getPrepDocumentUrl(roleplay.id, resource),
    }));
}

function mapDbQuizzesToPrepQuizzes(roleplay: DbRoleplayDetail): PrepQuiz[] {
    return roleplay.quizzes.map((quiz, index) => ({
        durationMinutes: quiz.durationMinutes,
        id: quiz.id,
        participation: quiz.participation,
        questionCount: quiz.questionCount,
        recommended: index === 0,
        status: "not_started",
        title: quiz.title,
        type: getQuizTypeLabel(quiz.type),
        url: EVALUATION_ROUTES.app.quiz(quiz.id),
    }));
}

export function findMockRoleplayById(roleplayId: string) {
    return roleplays.find((roleplay) => roleplay.id === roleplayId || roleplay.scenarioId === roleplayId) ?? null;
}

function findMockRoleplayForDb(roleplay: RoleplayListItem | DbRoleplayDetail) {
    const normalizedName = normalize(roleplay.name);
    const normalizedTitle = normalize(roleplay.title);

    return (
        roleplays.find((mock) => {
            return (
                mock.scenarioId === roleplay.id ||
                mock.id === roleplay.id ||
                normalize(mock.name) === normalizedName ||
                normalizedTitle.includes(normalize(mock.name)) ||
                normalize(mock.description) === normalize(roleplay.description)
            );
        }) ?? null
    );
}

function buildDetail(roleplay: RoleplayListItem | DbRoleplayDetail, mock: RoleplayItem | null): UiRoleplayDetail {
    const mockDetail = mock?.detail ?? {
        bestScoreDate: "Aucune session",
        context: "",
        infoChips: [],
        indexDelta: null,
        indexScore: null,
        indexSessions: [],
        indexSessionCount: 0,
        indexTrend: "unavailable" as const,
        lastDate: "Aucune session",
        lastDuration: "0s",
        learnerRole: "",
        meilleurScore: 0,
        method: "",
        objections: "",
        scoreActuel: 0,
        simulations: 0,
    };
    const dbDetail = "stats" in roleplay ? roleplay : null;
    const dbStats = dbDetail?.stats;
    const hasDbStats = Boolean(dbStats);

    return {
        bestScoreDate: hasDbStats && dbStats ? dbStats.bestScoreDate : mockDetail.bestScoreDate ?? mockDetail.lastDate,
        context: dbDetail ? textOrMock(dbDetail.context, mockDetail.context) : mockDetail.context,
        infoChips: mockDetail.infoChips,
        indexDelta: hasDbStats && dbStats ? dbStats.indexDelta : mockDetail.indexDelta ?? null,
        indexScore: hasDbStats && dbStats ? dbStats.indexScore : mockDetail.indexScore ?? null,
        indexSessions: hasDbStats && dbStats ? dbStats.indexSessions : mockDetail.indexSessions ?? [],
        indexSessionCount: hasDbStats && dbStats ? dbStats.indexSessionCount : mockDetail.indexSessionCount ?? 0,
        indexTrend: hasDbStats && dbStats ? dbStats.indexTrend : mockDetail.indexTrend ?? "unavailable",
        lastDate: hasDbStats && dbStats ? dbStats.lastDate : mockDetail.lastDate,
        lastDuration: hasDbStats && dbStats ? dbStats.lastDuration : mockDetail.lastDuration,
        learnerRole: dbDetail ? dbDetail.learnerRole : mockDetail.learnerRole,
        meilleurScore: hasDbStats && dbStats ? dbStats.bestScore : mockDetail.meilleurScore,
        method: textOrMock(roleplay.methodName, mockDetail.method),
        objections: dbDetail ? textOrMock(dbDetail.obstacles, mockDetail.objections) : mockDetail.objections,
        scoreActuel: hasDbStats && dbStats ? dbStats.scoreActuel : mockDetail.scoreActuel,
        simulations: hasDbStats && dbStats ? dbStats.simulations : roleplay.attemptCount,
    };
}

export function mapDbRoleplayToUi(roleplay: RoleplayListItem | DbRoleplayDetail, mock = findMockRoleplayForDb(roleplay)): RoleplayItem {
    const prepDocuments = "resources" in roleplay ? mapDbResourcesToPrepDocuments(roleplay) : mock?.prepDocuments;
    const prepQuizzes = "quizzes" in roleplay ? mapDbQuizzesToPrepQuizzes(roleplay) : mock?.prepQuizzes;
    const cardDescription = textOrMock(
        roleplay.previewDescription,
        textOrMock(roleplay.description, mock?.description ?? roleplay.title),
    );
    const cardTitle = textOrMock(roleplay.previewTitle, textOrMock(roleplay.title, mock?.title ?? roleplay.category));

    return {
        category: textOrMock(roleplay.category, mock?.category ?? ""),
        coachAvatarSrc: roleplay.coachAvatarUrl ?? "",
        coachId: roleplay.coachId ?? undefined,
        coachName: roleplay.coachName ?? undefined,
        company: textOrMock(roleplay.company, mock?.company ?? ""),
        description: cardDescription,
        detail: buildDetail(roleplay, mock),
        difficulty: roleplay.difficulty,
        disc: roleplay.disc,
        domain: textOrMock(roleplay.domain, mock?.domain ?? ""),
        id: roleplay.id,
        latestEvaluationSessionId:
            "stats" in roleplay ? roleplay.stats.latestEligibleSessionId ?? undefined : undefined,
        methodId: roleplay.methodId ?? mock?.methodId ?? "",
        name: textOrMock(roleplay.name, mock?.name ?? roleplay.title),
        prepDocuments,
        prepQuizzes,
        role: textOrMock(roleplay.role, mock?.role ?? ""),
        scenarioId: "scenarioId" in roleplay ? roleplay.scenarioId : roleplay.id,
        title: cardTitle,
        avatarSrc: roleplay.personaAvatarUrl ?? mock?.avatarSrc ?? "",
    };
}

export function mergeRoleplayListWithMocks(dbRoleplays: RoleplayListItem[]) {
    const matchedMockIds = new Set<string>();
    const mappedDbRoleplays = dbRoleplays.map((dbRoleplay) => {
        const mock = findMockRoleplayForDb(dbRoleplay);
        if (mock) {
            matchedMockIds.add(mock.id);
        }

        return mapDbRoleplayToUi(dbRoleplay, mock);
    });
    const remainingMocks = roleplays.filter((mock) => !matchedMockIds.has(mock.id));

    return [...mappedDbRoleplays, ...remainingMocks];
}

export function mapDbRoleplayListToUi(dbRoleplays: RoleplayListItem[]) {
    return dbRoleplays.map((dbRoleplay) => mapDbRoleplayToUi(dbRoleplay, null));
}

export function mapMethodDetailToUi(method: MethodDetail): Method {
    const mock =
        methods.find((item) => item.id === method.id) ??
        methods.find((item) => normalize(item.name) === normalize(method.name)) ??
        methods.find((item) => normalize(method.name).includes(normalize(item.name)));

    return {
        category: textOrMock(method.category, mock?.category ?? ""),
        description: textOrMock(method.description, mock?.description ?? ""),
        enjeux: listOrMock(method.challenges, mock?.enjeux ?? []),
        id: method.id,
        name: textOrMock(method.name, mock?.name ?? ""),
        objectifMetier: mock?.objectifMetier ?? "",
        objectifs: listOrMock(method.objectives, mock?.objectifs ?? []),
        quizQuestions: mock?.quizQuestions ?? 0,
        readingTime: textOrMock(method.readingTimeLabel, mock?.readingTime ?? ""),
        retenir: mock?.retenir ?? [],
        steps:
            method.steps.length > 0
                ? method.steps.map((step, index) => mapMethodStepToUi(step, mock?.steps[index]))
                : mock?.steps ?? [],
        subtitle: textOrMock(method.subtitle, mock?.subtitle ?? ""),
    };
}

export function mapMethodStepToUi(step: MethodStepItem, mock?: MethodStep): MethodStep {
    return {
        bonnesPratiques: listOrMock(step.bestPractices, mock?.bonnesPratiques ?? []),
        capsule: mock?.capsule ?? { duration: "", title: step.title },
        erreurs: listOrMock(step.pitfalls, mock?.erreurs ?? []),
        id: step.id,
        icon: step.icon,
        objectifs: listOrMock(step.objectives, mock?.objectifs ?? []),
        posture: listOrMock(step.posture, mock?.posture ?? []),
        summary: textOrMock(step.summary || step.takeaway, mock?.summary ?? ""),
        title: textOrMock(step.title, mock?.title ?? ""),
        verbatims: listOrMock(step.verbatims, mock?.verbatims ?? []),
    };
}
