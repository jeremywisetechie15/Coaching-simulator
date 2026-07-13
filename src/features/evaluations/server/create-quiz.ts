import { requireAdmin } from "@/features/auth/server";
import type { QuizDetail } from "@/features/evaluations/domain/quiz";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchQuizDetail } from "./quiz-query";
import { createQuizInsert, QUIZ_SELECT } from "./quiz.persistence";
import { replaceQuizChildren } from "./save-quiz-children";
import type { QuizRow } from "./quiz.mapper";
import {
    cleanupUploadedQuizStorageObjects,
    type QuizUploadFilesByClientId,
    type UploadedQuizStorageObject,
} from "./quiz-upload-files";

export async function createQuiz(
    input: SaveQuizDto,
    uploadFilesByClientId: QuizUploadFilesByClientId = new Map(),
): Promise<QuizDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    let createdQuizId: string | null = null;
    const uploadedObjects: UploadedQuizStorageObject[] = [];

    try {
        const { data: quizRow, error: quizError } = await adminSupabase
            .from("quizzes")
            .insert(createQuizInsert(input, context.userId))
            .select(QUIZ_SELECT)
            .single<QuizRow>();

        if (quizError) {
            throw quizError;
        }

        createdQuizId = quizRow.id;
        await replaceQuizChildren(
            adminSupabase,
            quizRow.id,
            input,
            uploadFilesByClientId,
            uploadedObjects,
            context.userId,
        );

        return fetchQuizDetail(adminSupabase, quizRow.id);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedQuizStorageObjects(adminSupabase, uploadedObjects);
        }

        if (createdQuizId) {
            await adminSupabase.from("quizzes").delete().eq("id", createdQuizId);
        }

        throw error;
    }
}
