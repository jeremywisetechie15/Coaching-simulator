import type { PropsWithChildren } from "react";

export function InputShell({ children }: PropsWithChildren) {
    return <div className="relative">{children}</div>;
}
