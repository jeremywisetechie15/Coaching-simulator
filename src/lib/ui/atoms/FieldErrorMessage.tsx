import { Text } from "@/lib/ui/atoms/Text";
import { uiTokens } from "@/lib/ui/tokens";

interface FieldErrorMessageProps {
    id?: string;
    message?: string | null;
}

export function FieldErrorMessage({ id, message }: FieldErrorMessageProps) {
    if (!message) return null;

    return (
        <Text id={id} role="alert" className={uiTokens.form.errorMessage}>
            {message}
        </Text>
    );
}
