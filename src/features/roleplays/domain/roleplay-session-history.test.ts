import { describe, expect, it } from "vitest";
import {
    DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS,
    countActiveRoleplaySessionHistoryFilters,
    filterRoleplaySessionHistory,
    listRoleplaySessionHistoryRoleplays,
} from "./roleplay-session-history";

const sessions = [
    {
        occurredAt: "2026-07-10T10:00:00.000Z",
        roleplay: {
            category: "Prospection",
            difficulty: "Moyen",
            domain: "Commercial",
            id: "roleplay-b",
            name: "Prospection B",
        },
    },
    {
        occurredAt: "2026-05-01T10:00:00.000Z",
        roleplay: {
            category: "Feedback",
            difficulty: "Difficile",
            domain: "Management",
            id: "roleplay-a",
            name: "Feedback A",
        },
    },
];

describe("roleplay session history filters", () => {
    it("combines roleplay, taxonomy and level filters", () => {
        expect(
            filterRoleplaySessionHistory(sessions, {
                category: "Prospection",
                dateFrom: "",
                dateTo: "",
                domain: "Commercial",
                level: "Moyen",
                roleplayId: "roleplay-b",
            }),
        ).toEqual([sessions[0]]);
    });

    it("includes both boundaries of the selected date range", () => {
        expect(
            filterRoleplaySessionHistory(sessions, {
                ...DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS,
                dateFrom: "2026-07-10",
                dateTo: "2026-07-10",
            }),
        ).toEqual([sessions[0]]);
    });

    it("lists each roleplay once and sorts labels", () => {
        expect(listRoleplaySessionHistoryRoleplays([...sessions, sessions[0]])).toEqual([
            { label: "Feedback A", value: "roleplay-a" },
            { label: "Prospection B", value: "roleplay-b" },
        ]);
    });

    it("counts only non-default filters", () => {
        expect(
            countActiveRoleplaySessionHistoryFilters({
                ...DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS,
                dateFrom: "2026-06-01",
                dateTo: "2026-06-30",
                domain: "Commercial",
            }),
        ).toBe(2);
    });
});
