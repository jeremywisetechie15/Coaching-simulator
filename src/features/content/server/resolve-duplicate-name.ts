import type { SupabaseClient } from "@supabase/supabase-js";
import { getDuplicateBaseName, getNextDuplicateName } from "@/features/content/domain";

type DuplicateNameColumn = "name" | "preview_title" | "title";
type DuplicateNameTable = "coaches" | "methods" | "personas" | "quizzes" | "scenarios" | "scorecards" | "skills";

interface ResolveDuplicateNameOptions {
    column: DuplicateNameColumn;
    maxLength: number;
    sourceName: string;
    table: DuplicateNameTable;
}

function escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, "\\$&");
}

export async function resolveDuplicateName(
    supabase: SupabaseClient,
    { column, maxLength, sourceName, table }: ResolveDuplicateNameOptions,
) {
    const baseName = getDuplicateBaseName(sourceName, maxLength);
    const { data, error } = await supabase
        .from(table)
        .select(column)
        .like(column, `${escapeLikePattern(baseName)}%`);

    if (error) throw error;

    const existingNames = (data ?? []).flatMap((row) => {
        const value = (row as Record<string, unknown>)[column];
        return typeof value === "string" ? [value] : [];
    });

    return getNextDuplicateName(sourceName, existingNames, maxLength);
}
