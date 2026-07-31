import { describe, expect, it } from "vitest";
import { buildUserAiInteractions } from "./list-user-ai-interactions";

describe("buildUserAiInteractions", () => {
    it("aggregates roleplay, Ask Persona and Coach usage independently", () => {
        expect(buildUserAiInteractions({
            aiConversations: [
                {
                    active_duration_seconds: 900,
                    ended_at: "2026-07-29T10:00:00.000Z",
                    id: "ask-1",
                    interaction_type: "ask_persona",
                    started_at: "2026-07-29T09:45:00.000Z",
                },
                {
                    active_duration_seconds: 600,
                    ended_at: "2026-07-30T10:00:00.000Z",
                    id: "coach-1",
                    interaction_type: "coach",
                    started_at: "2026-07-30T09:50:00.000Z",
                },
                {
                    active_duration_seconds: 300,
                    ended_at: "2026-07-31T10:00:00.000Z",
                    id: "coach-2",
                    interaction_type: "coach",
                    started_at: "2026-07-31T09:55:00.000Z",
                },
            ],
            roleplaySessions: [
                {
                    created_at: "2026-07-27T10:00:00.000Z",
                    duration_seconds: 1_200,
                    ended_at: "2026-07-27T10:20:00.000Z",
                    id: "simulation-1",
                },
                {
                    created_at: "2026-07-28T10:00:00.000Z",
                    duration_seconds: 1_800,
                    ended_at: null,
                    id: "simulation-2",
                },
            ],
        })).toEqual({
            items: [
                {
                    durationSeconds: 3_000,
                    label: "Simulations IA",
                    lastUsedAt: "2026-07-28T10:00:00.000Z",
                    sessions: 2,
                    type: "simulation",
                },
                {
                    durationSeconds: 900,
                    label: "Ask IA Persona",
                    lastUsedAt: "2026-07-29T10:00:00.000Z",
                    sessions: 1,
                    type: "ask_persona",
                },
                {
                    durationSeconds: 900,
                    label: "Coach IA",
                    lastUsedAt: "2026-07-31T10:00:00.000Z",
                    sessions: 2,
                    type: "coach",
                },
            ],
            totalDurationSeconds: 4_800,
        });
    });

    it("keeps all interaction categories visible when there is no usage", () => {
        expect(buildUserAiInteractions({
            aiConversations: [],
            roleplaySessions: [],
        })).toEqual({
            items: [
                {
                    durationSeconds: 0,
                    label: "Simulations IA",
                    lastUsedAt: null,
                    sessions: 0,
                    type: "simulation",
                },
                {
                    durationSeconds: 0,
                    label: "Ask IA Persona",
                    lastUsedAt: null,
                    sessions: 0,
                    type: "ask_persona",
                },
                {
                    durationSeconds: 0,
                    label: "Coach IA",
                    lastUsedAt: null,
                    sessions: 0,
                    type: "coach",
                },
            ],
            totalDurationSeconds: 0,
        });
    });
});
