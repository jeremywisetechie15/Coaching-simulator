"use client";

import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type SingleSelectOption = string | { icon?: LucideIcon; label: string; value: string };

function getSelectOptionValue(option: SingleSelectOption) {
    return typeof option === "string" ? option : option.value;
}

function getSelectOptionLabel(option: SingleSelectOption) {
    return typeof option === "string" ? option : option.label;
}

function getSelectOptionIcon(option: SingleSelectOption) {
    return typeof option === "string" ? undefined : option.icon;
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
    const selectedLabel = selectedOption ? getSelectOptionLabel(selectedOption) : value ?? placeholder;
    const SelectedIcon = selectedOption ? getSelectOptionIcon(selectedOption) : undefined;
    const hasSelectedValue = Boolean(selectedOption || value);

    return (
        <div ref={ref} className="relative w-full min-w-0 max-w-full">
            <Button
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={cn(
                    uiTokens.select.trigger,
                    disabled ? uiTokens.select.triggerDisabled : uiTokens.select.triggerEnabled,
                    hasSelectedValue ? uiTokens.select.triggerValue : uiTokens.select.triggerPlaceholder,
                )}
            >
                {SelectedIcon && <InlineIcon icon={SelectedIcon} className={uiTokens.select.triggerIcon} />}
                <Tooltip content={selectedLabel} disabled={!hasSelectedValue} className={uiTokens.select.triggerLabelWrapper}>
                    <Text as="span" className={uiTokens.select.triggerLabel}>
                        {selectedLabel}
                    </Text>
                </Tooltip>
                <InlineIcon
                    icon={ChevronDown}
                    className={cn(uiTokens.select.chevron, uiTokens.text.muted, open && "rotate-180")}
                />
            </Button>
            {open && !disabled && (
                <CardSurface className={uiTokens.select.menu}>
                    {options.map((option) => {
                        const optionValue = getSelectOptionValue(option);
                        const optionLabel = getSelectOptionLabel(option);
                        const OptionIcon = getSelectOptionIcon(option);
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
                                {OptionIcon && <InlineIcon icon={OptionIcon} className={uiTokens.select.optionIcon} />}
                                <Text as="span" className={cn(uiTokens.select.optionLabelWrapper, uiTokens.select.optionLabel)}>
                                    {optionLabel}
                                </Text>
                                {isSelected && <InlineIcon icon={Check} className={cn("mt-0.5 h-4 w-4 shrink-0", uiTokens.text.primary)} />}
                            </Button>
                        );
                    })}
                </CardSurface>
            )}
        </div>
    );
}
