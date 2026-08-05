import type { ChangeEventHandler } from "react";
import { FieldLabel, Stack, TextArea, TextInput } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ProfileFieldProps {
    id: string;
    label: string;
    multiline?: boolean;
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    readOnly?: boolean;
    required?: boolean;
    value: string;
}

export function ProfileField({
    id,
    label,
    multiline = false,
    onChange,
    readOnly = true,
    required = false,
    value,
}: ProfileFieldProps) {
    const fieldStateClassName = readOnly
        ? uiTokens.profile.field.readonly
        : uiTokens.profile.field.editable;

    return (
        <Stack className="space-y-2">
            <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
            {multiline ? (
                <TextArea
                    id={id}
                    disabled={readOnly}
                    value={value}
                    onChange={onChange}
                    className={cn(
                        "min-h-[110px] rounded-xl text-[15px] leading-relaxed disabled:cursor-not-allowed disabled:opacity-100",
                        fieldStateClassName,
                    )}
                />
            ) : (
                <TextInput
                    id={id}
                    disabled={readOnly}
                    value={value}
                    onChange={onChange}
                    hasLeadingIcon={false}
                    className={cn(uiTokens.profile.field.control, fieldStateClassName)}
                />
            )}
        </Stack>
    );
}
