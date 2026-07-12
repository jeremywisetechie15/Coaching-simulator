export const ROLEPLAY_NOTATION_TABS = [
    "synthese",
    "methodo",
    "transcription",
] as const;

export type RoleplayNotationTab = (typeof ROLEPLAY_NOTATION_TABS)[number];

export const ROLEPLAY_NOTATION_FOLLOWUP_TABS = [
    "synthese",
    "transcription",
] as const satisfies readonly RoleplayNotationTab[];
