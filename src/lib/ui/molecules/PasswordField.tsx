import type { ChangeEventHandler } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { FieldLabel, IconButton, InlineIcon, InputIcon, InputShell, Stack, TextInput } from "@/lib/ui/atoms";

interface PasswordFieldProps {
    id: string;
    isVisible: boolean;
    label?: string;
    name: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onToggleVisibility: () => void;
    value: string;
}

export function PasswordField({
    id,
    isVisible,
    label = "Password",
    name,
    onChange,
    onToggleVisibility,
    value,
}: PasswordFieldProps) {
    return (
        <Stack className="space-y-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <InputShell>
                <InputIcon icon={LockKeyhole} />
                <TextInput
                    id={id}
                    name={name}
                    type={isVisible ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={value}
                    onChange={onChange}
                    placeholder="••••••••"
                    hasTrailingAction
                />
                <IconButton
                    onClick={onToggleVisibility}
                    aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                    <InlineIcon icon={isVisible ? EyeOff : Eye} className="h-4 w-4" />
                </IconButton>
            </InputShell>
        </Stack>
    );
}
