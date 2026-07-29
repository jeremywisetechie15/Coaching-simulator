import {
    CONTENT_DIFFICULTIES,
    CONTENT_DIFFICULTY,
    DISC_PROFILE,
    DISC_PROFILES,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    CONTENT_VISIBILITY_SCOPES,
    isContentDifficulty,
    type ContentStatus,
    type ContentDifficulty,
    type ContentVisibilityScope,
    type DiscProfile,
    type EntitySelectionAvailability,
    type LearnerContentStatus,
} from "@/features/content/domain";
import type { QuizKind, QuizParticipation, QuizType } from "@/features/evaluations/domain";
import type { MethodSelectionOption } from "@/features/methods/domain/method";
import type { RoleplayIndexSession, RoleplayIndexTrend } from "./roleplay-index";

export const ROLEPLAY_DIFFICULTIES = CONTENT_DIFFICULTIES;

export const ROLEPLAY_LEARNER_ROLE_MAX_LENGTH = 2500;

export type RoleplayDifficulty = ContentDifficulty;

export const ROLEPLAY_DISC_PROFILES = DISC_PROFILES;

export type RoleplayDiscProfile = DiscProfile;

export const ROLEPLAY_VISIBILITY_SCOPE = CONTENT_VISIBILITY_SCOPE;

export const ROLEPLAY_VISIBILITY_SCOPES = CONTENT_VISIBILITY_SCOPES;

export type RoleplayVisibilityScope = ContentVisibilityScope;

export const ROLEPLAY_VISIBILITY_SCOPE_LABELS = CONTENT_VISIBILITY_SCOPE_LABELS;

export interface RoleplayPersonaOption extends EntitySelectionAvailability {
    avatarUrl: string | null;
    company: string;
    id: string;
    name: string;
    role: string;
}

export interface RoleplayCoachOption extends EntitySelectionAvailability {
    id: string;
    name: string;
}

export type RoleplayMethodOption = MethodSelectionOption;

export interface RoleplayQuizOption extends EntitySelectionAvailability {
    id: string;
    kind: QuizKind;
    methodId: string | null;
    questionCount: number;
    title: string;
}

export interface RoleplayScorecardOption extends EntitySelectionAvailability {
    id: string;
    methodId: string;
    name: string;
}

export interface RoleplayOrganizationOption extends EntitySelectionAvailability {
    id: string;
    name: string;
}

export interface RoleplayGroupOption extends EntitySelectionAvailability {
    id: string;
    name: string;
    organizationId: string;
}

export interface RoleplayUserOption extends EntitySelectionAvailability {
    groupIds: string[];
    id: string;
    name: string;
    organizationIds: string[];
}

export interface RoleplayQuizLink {
    durationMinutes: number;
    hasInProgress: boolean;
    id: string;
    learnerStatus: LearnerContentStatus;
    participation: QuizParticipation;
    questionCount: number;
    scorePercent: number | null;
    title: string;
    type: QuizType;
}

export interface RoleplayResource {
    externalUrl: string | null;
    id: string;
    label: string;
    resourceType: "document" | "image" | "video" | "audio" | "link";
    storageBucket: string | null;
    storagePath: string | null;
}

export interface RoleplayStats {
    bestScore: number;
    bestScoreDate: string;
    indexDelta: number | null;
    indexScore: number | null;
    indexSessions: RoleplayIndexSession[];
    indexSessionCount: number;
    indexTrend: RoleplayIndexTrend;
    lastDate: string;
    lastDuration: string;
    learnerStatus: LearnerContentStatus;
    latestEligibleSessionId: string | null;
    scoreActuel: number;
    simulations: number;
}

export interface RoleplayPersonaFacts {
    age: number | null;
    annualRevenue: string;
    employeeCount: number | null;
    industry: string;
}

export interface RoleplayListItem {
    assignedUserId: string | null;
    assignedUserName: string | null;
    attemptCount: number;
    bestScore: number | null;
    category: string;
    coachAvatarUrl: string | null;
    coachId: string | null;
    coachName: string | null;
    backgroundImagePath: string | null;
    company: string;
    description: string;
    previewDescription: string;
    previewTitle: string;
    difficulty: RoleplayDifficulty;
    disc: RoleplayDiscProfile;
    domain: string;
    groupId: string | null;
    groupName: string | null;
    id: string;
    isActive: boolean;
    learnerStatus: LearnerContentStatus;
    methodId: string | null;
    methodName: string | null;
    name: string;
    organizationId: string | null;
    organizationName: string | null;
    personaAvatarUrl: string | null;
    personaFacts: RoleplayPersonaFacts;
    personaId: string | null;
    quizCount: number;
    role: string;
    scope: RoleplayVisibilityScope;
    scorecardId: string | null;
    scorecardName: string | null;
    status: ContentStatus;
    title: string;
    updatedAt: string | null;
}

export interface RoleplayDetail extends RoleplayListItem {
    coachingSteps: string;
    configuredDifficulty: RoleplayDifficulty | null;
    context: string;
    createdAt: string | null;
    learnerRole: string;
    methodStepCount: number;
    objective: string;
    obstacles: string;
    quizIds: string[];
    quizzes: RoleplayQuizLink[];
    resources: RoleplayResource[];
    scenarioId: string;
    stats: RoleplayStats;
}

/** Données privées réservées au formulaire d'administration du roleplay. */
export interface RoleplayEditorDetail extends RoleplayDetail {
    aiInstructions: string;
    hasSessions: boolean;
}

export function isRoleplayDifficulty(value: unknown): value is RoleplayDifficulty {
    return isContentDifficulty(value);
}

export function normalizeRoleplayDifficulty(value: unknown): RoleplayDifficulty {
    return isRoleplayDifficulty(value) ? value : CONTENT_DIFFICULTY.medium;
}

export function getRoleplayDisplayTitle(roleplay: { name: string; title?: string | null }) {
    return roleplay.title?.trim() || roleplay.name.trim();
}

export function isRoleplayDiscProfile(value: unknown): value is RoleplayDiscProfile {
    return typeof value === "string" && ROLEPLAY_DISC_PROFILES.includes(value as RoleplayDiscProfile);
}

export function normalizeRoleplayDiscProfile(value: unknown): RoleplayDiscProfile {
    return isRoleplayDiscProfile(value) ? value : DISC_PROFILE.stable;
}

export function isRoleplayVisibilityScope(value: unknown): value is RoleplayVisibilityScope {
    return typeof value === "string" && ROLEPLAY_VISIBILITY_SCOPES.includes(value as RoleplayVisibilityScope);
}

export function normalizeRoleplayVisibilityScope(value: unknown): RoleplayVisibilityScope {
    return isRoleplayVisibilityScope(value) ? value : ROLEPLAY_VISIBILITY_SCOPE.public;
}
