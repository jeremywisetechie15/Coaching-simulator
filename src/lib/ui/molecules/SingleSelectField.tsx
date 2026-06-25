"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type SingleSelectOption = string | { label: string; value: string };

function getSelectOptionValue(option: SingleSelectOption) {
    return typeof option === "string" ? option : option.value;
}

function getSelectOptionLabel(option: SingleSelectOption) {
    return typeof option === "string" ? option : option.label;
}

function useOutsideClose(onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);
    return ref;
}

interface SingleSelectFieldProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    options: SingleSelectOption[];
    placeholder: string;
    value: string | null;
}

export function SingleSelectField({
    disabled,
    onChange,
    options,
    placeholder,
    value,
}: SingleSelectFieldProps) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));
    const selectedOption = options.find((option) => getSelectOptionValue(option) === value);

    return (
        <div ref={ref} className="relative">
            <Button
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={cn(
                    uiTokens.select.trigger,
                    disabled ? uiTokens.select.triggerDisabled : uiTokens.select.triggerEnabled,
                    value ? uiTokens.select.triggerValue : uiTokens.select.triggerPlaceholder,
                )}
            >
                <Text as="span">{selectedOption ? getSelectOptionLabel(selectedOption) : value ?? placeholder}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={cn("h-4 w-4 transition-transform", uiTokens.text.muted, open && "rotate-180")}
                />
            </Button>
            {open && !disabled && (
                <CardSurface className={uiTokens.select.menu}>
                    {options.map((option) => {
                        const optionValue = getSelectOptionValue(option);
                        const isSelected = optionValue === value;

                        return (
                            <Button
                                key={optionValue}
                                onClick={() => {
                                    onChange(optionValue);
                                    setOpen(false);
                                }}
                                className={cn(
                                    uiTokens.select.option,
                                    isSelected ? uiTokens.select.optionActive : uiTokens.select.optionIdle,
                                )}
                            >
                                {getSelectOptionLabel(option)}
                                {isSelected && <InlineIcon icon={Check} className={cn("h-4 w-4", uiTokens.text.primary)} />}
                            </Button>
                        );
                    })}
                </CardSurface>
            )}
        </div>
    );
}
