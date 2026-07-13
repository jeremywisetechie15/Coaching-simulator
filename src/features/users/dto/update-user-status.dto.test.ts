import { describe, expect, it } from "vitest";
import { USER_STATUS_ACTION } from "@/features/users/domain";
import { updateUserStatusDto } from "./update-user-status.dto";

describe("updateUserStatusDto", () => {
    it("accepts the supported status actions", () => {
        expect(updateUserStatusDto.parse({ action: USER_STATUS_ACTION.suspend })).toEqual({
            action: USER_STATUS_ACTION.suspend,
        });
        expect(updateUserStatusDto.parse({ action: USER_STATUS_ACTION.reactivate })).toEqual({
            action: USER_STATUS_ACTION.reactivate,
        });
    });

    it("rejects arbitrary status values", () => {
        expect(() => updateUserStatusDto.parse({ action: "delete" })).toThrow();
    });
});
