import { Plus, X } from "lucide-react";
import { Box, Button, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EditableTextListFieldProps {
    addLabel?: string;
    items: string[];
    label: string;
    onAdd: () => void;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    showAddLabel?: boolean;
}

export function EditableTextListField({
    addLabel = "Ajouter",
    items,
    label,
    onAdd,
    onChange,
    onRemove,
    placeholder,
    showAddLabel,
}: EditableTextListFieldProps) {
    return (
        <Box>
            <Box className="flex items-center justify-between">
                <Text as="span" className={cn("text-[13px] font-bold", uiTokens.text.subtle)}>
                    {label}
                </Text>
                {showAddLabel ? (
                    <Button onClick={onAdd} className={uiTokens.action.addButton}>
                        <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                        {addLabel}
                    </Button>
                ) : (
                    <Button
                        onClick={onAdd}
                        aria-label={`Ajouter - ${label}`}
                        className={uiTokens.action.iconButton}
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                    </Button>
                )}
            </Box>
            <Box className="mt-2 space-y-2">
                {items.map((item, index) => (
                    <Box key={index} className="flex items-center gap-2.5">
                        <Box className={uiTokens.surface.bullet} />
                        <TextInput
                            value={item}
                            onChange={(event) => onChange(index, event.target.value)}
                            placeholder={placeholder}
                            hasLeadingIcon={false}
                            className={uiTokens.form.controlWhite}
                        />
                        {items.length > 1 && (
                            <Button
                                aria-label="Retirer"
                                onClick={() => onRemove(index)}
                                className={uiTokens.action.listRemoveButton}
                            >
                                <InlineIcon icon={X} className="h-4 w-4" />
                            </Button>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
