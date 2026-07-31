import type {
    HTMLAttributes,
    PropsWithChildren,
    TableHTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from "react";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type DataTableWidth = keyof typeof uiTokens.dataTable.width;

export function DataTableFrame({
    children,
    className,
}: PropsWithChildren<{ className?: string }>) {
    return (
        <Box className={cn(uiTokens.dataTable.frame, className)}>
            <Box className={uiTokens.dataTable.scroll}>{children}</Box>
        </Box>
    );
}

export function DataTable({
    children,
    className,
    width = "wide",
    ...props
}: PropsWithChildren<
    TableHTMLAttributes<HTMLTableElement> & {
        width?: DataTableWidth;
    }
>) {
    return (
        <Box
            as="table"
            className={cn(
                uiTokens.dataTable.table,
                uiTokens.dataTable.width[width],
                className,
            )}
            {...props}
        >
            {children}
        </Box>
    );
}

export function DataTableHead({
    children,
    className,
    ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
    return (
        <Box
            as="thead"
            className={cn(uiTokens.dataTable.header, className)}
            {...props}
        >
            {children}
        </Box>
    );
}

export function DataTableHeaderCell({
    children,
    className,
    ...props
}: PropsWithChildren<ThHTMLAttributes<HTMLTableCellElement>>) {
    return (
        <Box
            as="th"
            className={cn(uiTokens.dataTable.headerCell, className)}
            {...props}
        >
            {children}
        </Box>
    );
}

export function DataTableRow({
    children,
    className,
    ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableRowElement>>) {
    return (
        <Box
            as="tr"
            className={cn(uiTokens.dataTable.row, className)}
            {...props}
        >
            {children}
        </Box>
    );
}

export function DataTableCell({
    children,
    className,
    nowrap = false,
    ...props
}: PropsWithChildren<
    TdHTMLAttributes<HTMLTableCellElement> & {
        nowrap?: boolean;
    }
>) {
    return (
        <Box
            as="td"
            className={cn(
                uiTokens.dataTable.cell,
                nowrap && uiTokens.dataTable.cellNowrap,
                className,
            )}
            {...props}
        >
            {children}
        </Box>
    );
}
