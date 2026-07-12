import { describe, expect, it } from "vitest";
import { resolveDuplicateName } from "./resolve-duplicate-name";

describe("resolveDuplicateName", () => {
    it("loads matching names and returns the next suffix", async () => {
        const supabase = {
            from(table: string) {
                expect(table).toBe("personas");
                return {
                    select(column: string) {
                        expect(column).toBe("name");
                        return {
                            like: async (filterColumn: string, pattern: string) => {
                                expect(filterColumn).toBe("name");
                                expect(pattern).toBe("Sophie Martin%");
                                return {
                                    data: [
                                        { name: "Sophie Martin" },
                                        { name: "Sophie Martin (2)" },
                                    ],
                                    error: null,
                                };
                            },
                        };
                    },
                };
            },
        };

        await expect(resolveDuplicateName(supabase as never, {
            column: "name",
            maxLength: 160,
            sourceName: "Sophie Martin",
            table: "personas",
        })).resolves.toBe("Sophie Martin (3)");
    });
});
