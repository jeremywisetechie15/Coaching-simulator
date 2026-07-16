import {
    saveMethodDto,
    type SaveMethodDto,
    type SaveMethodInput,
} from "@/features/methods/dto/save-method.dto";
import { getFormSubmitIssuesMessage } from "@/lib/ui/feedback/form-submit-feedback";

export type MethodFormValidationResult =
    | { data: SaveMethodDto; success: true }
    | { message: string; success: false };

export function validateMethodFormPayload(input: SaveMethodInput): MethodFormValidationResult {
    const result = saveMethodDto.safeParse(input);

    if (result.success) {
        return { data: result.data, success: true };
    }

    return {
        message: getFormSubmitIssuesMessage(
            result.error.issues,
            "Vérifiez les champs obligatoires du formulaire.",
        ),
        success: false,
    };
}
