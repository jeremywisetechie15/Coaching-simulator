import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiTokens } from "@/lib/ui/tokens";
import {
    DataTable,
    DataTableCell,
    DataTableFrame,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
} from "./DataTable";

describe("DataTable", () => {
    it("applies the shared table tokens and width variant", () => {
        const html = renderToStaticMarkup(
            <DataTableFrame>
                <DataTable width="standard">
                    <DataTableHead>
                        <tr>
                            <DataTableHeaderCell>Nom</DataTableHeaderCell>
                        </tr>
                    </DataTableHead>
                    <tbody>
                        <DataTableRow>
                            <DataTableCell nowrap>Paul</DataTableCell>
                        </DataTableRow>
                    </tbody>
                </DataTable>
            </DataTableFrame>,
        );

        expect(html).toContain(uiTokens.dataTable.frame);
        expect(html).toContain(uiTokens.dataTable.header);
        expect(html).toContain(uiTokens.dataTable.headerCell);
        expect(html).toContain(uiTokens.dataTable.width.standard);
        expect(html).toContain(uiTokens.dataTable.cellNowrap);
    });

    it("supports the extra-wide list-table variant", () => {
        const html = renderToStaticMarkup(
            <DataTable width="extraWide">
                <tbody>
                    <DataTableRow>
                        <DataTableCell>Organisation</DataTableCell>
                    </DataTableRow>
                </tbody>
            </DataTable>,
        );

        expect(html).toContain(uiTokens.dataTable.width.extraWide);
    });
});
