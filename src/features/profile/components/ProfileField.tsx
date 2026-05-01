import type { ChangeEventHandler } from "react";
import { FieldLabel, Stack, Text, TextArea, TextInput } from "@/lib/ui/atoms";

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
    const fieldClassName = readOnly
        ? "border-[#E8EAF0] bg-[#FCFCFD] text-[#7A7F8B] shadow-none"
        : "border-[#5140F0]/30 bg-white text-[#171B2A] shadow-[0_0_0_4px_rgba(81,64,240,0.08)]";

    return (
        <Stack className="space-y-2">
            <FieldLabel htmlFor={id}>
                {label}{" "}
                {required && (
                    <Text as="span" className="text-[#FF4E68]">
                        *
                    </Text>
                )}
            </FieldLabel>
            {multiline ? (
                <TextArea
                    id={id}
                    disabled={readOnly}
                    value={value}
                    onChange={onChange}
                    className={`min-h-[110px] rounded-xl text-[15px] leading-relaxed disabled:cursor-not-allowed disabled:opacity-100 ${fieldClassName}`}
                />
            ) : (
                <TextInput
                    id={id}
                    disabled={readOnly}
                    value={value}
                    onChange={onChange}
                    hasLeadingIcon={false}
                    className={`h-[42px] rounded-xl text-[15px] disabled:cursor-not-allowed disabled:opacity-100 ${fieldClassName}`}
                />
            )}
        </Stack>
    );
}
