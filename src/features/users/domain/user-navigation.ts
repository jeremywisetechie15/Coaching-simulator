import { withSearchParam, withoutSearchParam } from "@/features/app-shell/domain";

export type UserDetailMode = "edit" | "view";

const USER_DETAIL_MODE_PARAM = "mode";

export function getUserDetailHref(userId: string, mode: UserDetailMode = "view") {
    const href = `/users/${encodeURIComponent(userId)}`;

    return mode === "edit" ? withSearchParam(href, USER_DETAIL_MODE_PARAM, mode) : href;
}

export function withoutUserDetailMode(href: string) {
    return withoutSearchParam(href, USER_DETAIL_MODE_PARAM);
}
