import type { ChangeEventHandler, HTMLInputAutoCompleteAttribute } from "react";
import type { LucideIcon } from "lucide-react";
import { FieldLabel, InputIcon, InputShell, Stack, TextInput } from "@/lib/ui/atoms";

interface TextFieldProps {
    autoComplete: HTMLInputAutoCompleteAttribute;
    icon: LucideIcon;
    id: string;
    label: string;
    name: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    required?: boolean;
    type: string;
    value: string;
}

export function TextField({
    autoComplete,
    icon,
    id,
    label,
    name,
    onChange,
    placeholder,
    required = false,
    type,
    value,
}: TextFieldProps) {
    return (
        <Stack className="space-y-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <InputShell>
                <InputIcon icon={icon} />
                <TextInput
                    id={id}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    required={required}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
            </InputShell>
        </Stack>
    );
}
