export interface RoleplaySession {
    id: string;
    roleplayId: string;
    date: string;
    duration: string;
    score: number;
}

export const roleplaySessions: RoleplaySession[] = [
    {
        id: "session-1",
        roleplayId: "rachid-hamrani",
        date: "18-05-2026",
        duration: "03:47",
        score: 50,
    },
    {
        id: "session-2",
        roleplayId: "sophie-martin",
        date: "12-05-2026",
        duration: "05:21",
        score: 82,
    },
    {
        id: "session-3",
        roleplayId: "marc-dubois",
        date: "28-04-2026",
        duration: "07:10",
        score: 64,
    },
];
