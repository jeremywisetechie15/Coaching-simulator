"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Box, Button, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export interface SearchableOption {
    group?: string;
    label: string;
    value: string;
}

interface SearchableMultiSelectFieldProps {
    /** Variante de style du bouton d'ouverture (défaut : `uiTokens.action.addButton`). */
    addButtonClassName?: string;
    addLabel: string;
    emptyHint?: string;
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
    options: SearchableOption[];
    searchPlaceholder: string;
    selectedValues: string[];
}

/**
 * Sélecteur multiple recherchable : les éléments choisis s'affichent en « chips »
 * et l'ajout se fait via un champ de recherche déroulant (pas la liste complète).
 */
export function SearchableMultiSelectField({
    addButtonClassName,
    addLabel,
    emptyHint,
    onAdd,
    onRemove,
    options,
    searchPlaceholder,
    selectedValues,
}: SearchableMultiSelectFieldProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selectedOptions = selectedValues
        .map((value) => options.find((option) => option.value === value))
        .filter((option): option is SearchableOption => Boolean(option));

    const availableOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return options.filter((option) => {
            if (selectedValues.includes(option.value)) return false;
            if (!normalizedQuery) return true;
            return (
                option.label.toLowerCase().includes(normalizedQuery) ||
                (option.group?.toLowerCase().includes(normalizedQuery) ?? false)
            );
        });
    }, [options, query, selectedValues]);

    return (
        <Box className="space-y-2">
            {selectedOptions.length > 0 && (
                <Box className="flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                        <Box
                            key={option.value}
                            className={uiTokens.searchableSelect.chip}
                        >
                            <Text as="span">{option.label}</Text>
                            <Button
                                aria-label={`Retirer ${option.label}`}
                                onClick={() => onRemove(option.value)}
                                className={uiTokens.searchableSelect.chipRemoveButton}
                            >
                                <InlineIcon icon={X} className="h-3.5 w-3.5" />
                            </Button>
                        </Box>
                    ))}
                </Box>
            )}

            {open ? (
                <Box className={uiTokens.searchableSelect.panel}>
                    <TextInput
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={searchPlaceholder}
                        hasLeadingIcon={false}
                        className={uiTokens.form.controlWhite}
                    />
                    <Box className="mt-2 max-h-[240px] space-y-1 overflow-y-auto">
                        {availableOptions.length === 0 ? (
                            <Text className={cn("px-3 py-6 text-center text-[13px]", uiTokens.text.muted)}>
                                {emptyHint ?? "Aucun résultat"}
                            </Text>
                        ) : (
                            availableOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    onClick={() => {
                                        onAdd(option.value);
                                        setQuery("");
                                    }}
                                    className={uiTokens.searchableSelect.option}
                                >
                                    <Text as="span" className={cn("text-[14px] font-semibold", uiTokens.text.heading)}>
                                        {option.label}
                                    </Text>
                                    {option.group && (
                                        <Text as="span" className={cn("text-[12px]", uiTokens.text.muted)}>
                                            {option.group}
                                        </Text>
                                    )}
                                </Button>
                            ))
                        )}
                    </Box>
                    <Button
                        onClick={() => {
                            setOpen(false);
                            setQuery("");
                        }}
                        className={uiTokens.searchableSelect.closeButton}
                    >
                        Fermer
                    </Button>
                </Box>
            ) : (
                <Button onClick={() => setOpen(true)} className={addButtonClassName ?? uiTokens.action.addButton}>
                    <InlineIcon icon={Plus} className="h-4 w-4" />
                    {addLabel}
                </Button>
            )}
        </Box>
    );
}
