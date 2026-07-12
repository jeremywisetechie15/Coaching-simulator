import {
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    CONTENT_VISIBILITY_SCOPES,
    type ContentStatus,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import type { QuizKind, QuizParticipation, QuizType } from "@/features/evaluations/domain";
import type { RoleplayIndexSession, RoleplayIndexTrend } from "./roleplay-index";

export const ROLEPLAY_DIFFICULTIES = ["Facile", "Moyen", "Difficile"] as const;

export type RoleplayDifficulty = (typeof ROLEPLAY_DIFFICULTIES)[number];

export const ROLEPLAY_DISC_PROFILES = ["Dominant", "Influent", "Stable", "Consciencieux"] as const;

export type RoleplayDiscProfile = (typeof ROLEPLAY_DISC_PROFILES)[number];

export const ROLEPLAY_VISIBILITY_SCOPE = CONTENT_VISIBILITY_SCOPE;

export const ROLEPLAY_VISIBILITY_SCOPES = CONTENT_VISIBILITY_SCOPES;

export type RoleplayVisibilityScope = ContentVisibilityScope;

export const ROLEPLAY_VISIBILITY_SCOPE_LABELS = CONTENT_VISIBILITY_SCOPE_LABELS;

export interface RoleplayPersonaOption {
    avatarUrl: string | null;
    company: string;
    id: string;
    name: string;
    role: string;
}

export interface RoleplayCoachOption {
    id: string;
    name: string;
}

export interface RoleplayMethodOption {
    id: string;
    name: string;
    shortName: string;
}

export interface RoleplayQuizOption {
    id: string;
    kind: QuizKind;
    methodId: string | null;
    questionCount: number;
    title: string;
}

export interface RoleplayScorecardOption {
    id: string;
    methodId: string;
    name: string;
}

export interface RoleplayOrganizationOption {
    id: string;
    name: string;
}

export interface RoleplayGroupOption {
    id: string;
    name: string;
    organizationId: string;
}

export interface RoleplayUserOption {
    groupIds: string[];
    id: string;
    name: string;
    organizationIds: string[];
}

export interface RoleplayQuizLink {
    durationMinutes: number;
    id: string;
    participation: QuizParticipation;
    questionCount: number;
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
    latestEligibleSessionId: string | null;
    scoreActuel: number;
    simulations: number;
}

export interface RoleplayListItem {
    assignedUserId: string | null;
    assignedUserName: string | null;
    attemptCount: number;
    category: string;
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
    methodId: string | null;
    methodName: string | null;
    name: string;
    organizationId: string | null;
    organizationName: string | null;
    personaAvatarUrl: string | null;
    personaId: string;
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
    context: string;
    createdAt: string | null;
    methodStepCount: number;
    objective: string;
    obstacles: string;
    quizIds: string[];
    quizzes: RoleplayQuizLink[];
    resources: RoleplayResource[];
    scenarioId: string;
    stats: RoleplayStats;
}

export function isRoleplayDifficulty(value: unknown): value is RoleplayDifficulty {
    return typeof value === "string" && ROLEPLAY_DIFFICULTIES.includes(value as RoleplayDifficulty);
}

export function normalizeRoleplayDifficulty(value: unknown): RoleplayDifficulty {
    return isRoleplayDifficulty(value) ? value : "Moyen";
}

export function isRoleplayDiscProfile(value: unknown): value is RoleplayDiscProfile {
    return typeof value === "string" && ROLEPLAY_DISC_PROFILES.includes(value as RoleplayDiscProfile);
}

export function normalizeRoleplayDiscProfile(value: unknown): RoleplayDiscProfile {
    return isRoleplayDiscProfile(value) ? value : "Stable";
}

export function isRoleplayVisibilityScope(value: unknown): value is RoleplayVisibilityScope {
    return typeof value === "string" && ROLEPLAY_VISIBILITY_SCOPES.includes(value as RoleplayVisibilityScope);
}

export function normalizeRoleplayVisibilityScope(value: unknown): RoleplayVisibilityScope {
    return isRoleplayVisibilityScope(value) ? value : ROLEPLAY_VISIBILITY_SCOPE.public;
}
