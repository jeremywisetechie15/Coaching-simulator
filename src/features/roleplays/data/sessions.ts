export interface RoleplaySession {
    attemptNumber: number;
    id: string;
    roleplayId: string;
    date: string;
    time: string;
    duration: string;
    score: number;
}

export const roleplaySessions: RoleplaySession[] = [
    {
        attemptNumber: 1,
        id: "session-1",
        roleplayId: "rachid-hamrani",
        date: "18-05-2026",
        time: "14:35",
        duration: "03:47",
        score: 50,
    },
    {
        attemptNumber: 1,
        id: "session-2",
        roleplayId: "sophie-martin",
        date: "12-05-2026",
        time: "10:20",
        duration: "05:21",
        score: 82,
    },
    {
        attemptNumber: 1,
        id: "session-3",
        roleplayId: "marc-dubois",
        date: "28-04-2026",
        time: "16:45",
        duration: "07:10",
        score: 64,
    },
];
