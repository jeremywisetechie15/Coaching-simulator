import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@/features/users/domain";
import { updateUserDto } from "./update-user.dto";

describe("update user dto", () => {
    it("normalizes editable user details without accepting an email change", () => {
        expect(updateUserDto.parse({
            email: " learner@example.com ",
            firstName: " Alex ",
            lastName: " Martin ",
            role: USER_ROLE.learner,
        })).toEqual({
            firstName: "Alex",
            lastName: "Martin",
            role: USER_ROLE.learner,
        });
    });

    it("rejects invalid identity fields", () => {
        expect(() => updateUserDto.parse({
            firstName: "",
            lastName: "Martin",
            role: "owner",
        })).toThrow();
    });
});
