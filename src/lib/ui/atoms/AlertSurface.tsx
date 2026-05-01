import type { PropsWithChildren } from "react";

export function AlertSurface({ children }: PropsWithChildren) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {children}
        </div>
    );
}
