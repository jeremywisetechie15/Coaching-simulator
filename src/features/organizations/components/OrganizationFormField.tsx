import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { Box, FieldLabel, InlineIcon, SelectInput, Text, TextInput } from "@/lib/ui/atoms";

interface OrganizationFormFieldBaseProps {
    error?: string;
    id: string;
    label: string;
    required?: boolean;
}

interface OrganizationTextFieldProps extends OrganizationFormFieldBaseProps {
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    type?: "text";
}

interface OrganizationSelectFieldProps extends OrganizationFormFieldBaseProps {
    options: Array<{
        label: string;
        value: string;
    }>;
    selectProps: SelectHTMLAttributes<HTMLSelectElement>;
    type: "select";
}

type OrganizationFormFieldProps = OrganizationTextFieldProps | OrganizationSelectFieldProps;

export function OrganizationFormField(props: OrganizationFormFieldProps) {
    const errorId = `${props.id}-error`;

    return (
        <Box className="space-y-1.5">
            <FieldLabel required={props.required} htmlFor={props.id} className="text-[14px] font-bold leading-5 text-[#171B2A]">
                {props.label}
            </FieldLabel>

            {props.type === "select" ? (
                <Box className="relative">
                    <SelectInput
                        id={props.id}
                        aria-describedby={props.error ? errorId : undefined}
                        aria-invalid={props.error ? true : undefined}
                        {...props.selectProps}
                        className={`!h-9 rounded-lg border-0 bg-[#F1F1F4] px-4 text-[14px] font-semibold text-[#111827] shadow-none focus:bg-white ${
                            props.error ? "ring-2 ring-[#FF4E68]/30" : ""
                        }`}
                    >
                        {props.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </SelectInput>
                    <InlineIcon
                        icon={ChevronDown}
                        className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9EA3AF]"
                    />
                </Box>
            ) : (
                <TextInput
                    id={props.id}
                    aria-describedby={props.error ? errorId : undefined}
                    aria-invalid={props.error ? true : undefined}
                    hasLeadingIcon={false}
                    {...props.inputProps}
                    className={`!h-9 rounded-lg border-0 bg-[#F1F1F4] px-4 text-[14px] font-semibold text-[#111827] shadow-none placeholder:text-[#747789] focus:bg-white ${
                        props.error ? "ring-2 ring-[#FF4E68]/30" : ""
                    }`}
                />
            )}

            {props.error && (
                <Text id={errorId} className="text-[12px] font-semibold leading-4 text-[#D92D3A]">
                    {props.error}
                </Text>
            )}
        </Box>
    );
}
