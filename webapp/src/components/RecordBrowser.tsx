import "./RecordBrowser.css";

import type { Pagination, RecordQueryable, Sorting } from "./RecordQueryable.tsx";
import { createEffect, createMemo, createResource, createSignal, For, Match, Show, Switch, untrack } from "solid-js";
import { executeSQL, type Request } from "../api.ts";
import isEqual from "lodash.isequal";
import { PaginationBar } from "./PaginationBar.tsx";
import DataViewerPanel from "./DataViewerPanel.tsx";
import FilterBar from "./FilterBar.tsx";


export default function RecordBrowser(props: {
    queryable: RecordQueryable,
    visible: boolean,
}) {
    const [sorting, setSorting] = createSignal<Sorting | undefined>();
    const [pagination, setPagination] = createSignal<Pagination | undefined>(
        props.queryable.canPaginate ? { offset: 0, limit: 100 } : undefined
    )
    const [filter, setFilter] = createSignal<string | undefined>();

    const [selectedCell, setSelectedCell] = createSignal<{ row: number; column: number } | undefined>();
    const [showDisplayPanel, setShowDisplayPanel] = createSignal(false);

    const request = () => {
        const queries = [];

        const mainQueryIndex = queries.length;
        queries.push(props.queryable.mainQuery({
            sorting: sorting(),
            pagination: pagination(),
            filter: filter(),
        }));

        let countQueryIndex: number | undefined;
        if (props.queryable.countQuery) {
            countQueryIndex = queries.length;
            queries.push(props.queryable.countQuery({
                sorting: sorting(),
                filter: filter(),
            }));
        }

        let columnMetaIndex;
        let columnMetaParser;
        if (props.queryable.columnMetaQuery) {
            columnMetaIndex = queries.length;
            columnMetaParser = props.queryable.columnMetaQuery.parser;
            queries.push(props.queryable.columnMetaQuery.query);
        }

        return {
            request: { queries } as Request,
            mainQueryIndex,
            countQueryIndex,
            columnMetaIndex,
            columnMetaParser
        };
    };

    const [data, { refetch }] = createResource(request, async ({ request, mainQueryIndex, countQueryIndex, columnMetaIndex, columnMetaParser }) => {
        const resp = await executeSQL(request);

        return {
            mainResult: resp.results[mainQueryIndex],
            countResult: typeof countQueryIndex == "number"
                ? (resp.results[countQueryIndex].rows[0][0] as number)
                : undefined,
            columnMeta: (typeof columnMetaIndex == "number" && columnMetaParser)
                ? columnMetaParser(resp.results[columnMetaIndex].rows)
                : undefined,
        };
    });

    const errorElements = createMemo(() => {
        const e = data.error;
        if (typeof e == "object" && "message" in e) {
            return <>
                <p>Error loading data: {e.message}</p>
                {"diagnostic" in e && <pre>{e.diagnostic}</pre>}
            </>
        }
    });

    createEffect(() => {
        const d = data.latest;
        const p = untrack(pagination);
        if (d && d.countResult && p) {
            const newPagination = {
                ...p,
                offset: Math.min(p.offset, d.countResult),
            }
            if (!isEqual(p, newPagination)) {
                setPagination(newPagination);
            }
        }
    });

    const selectedCellValue = createMemo(() => {
        const d = data.latest;
        const cell = selectedCell();

        if (d && cell && cell.row < d.mainResult.rows.length && cell.column < d.mainResult.columns.length) {
            return {
                columnMeta: d.columnMeta?.[d.mainResult.columns[cell.column].name],
                value: d.mainResult.rows[cell.row][cell.column],
            }
        }
    });

    const onKeyDown = (e: KeyboardEvent) => {
        const selected = selectedCell();
        const d = data.latest;
        if (selected && d) {
            let row = selected.row;
            let column = selected.column;
            switch (e.key) {
                case "ArrowUp": row = Math.max(0, row - 1); break;
                case "ArrowDown": row = Math.min(d.mainResult.rows.length - 1, row + 1); break;
                case "ArrowLeft": column = Math.max(0, column - 1); break
                case "Enter":
                case "ArrowRight": column = Math.min(d.mainResult.columns.length - 1, column + 1); break;
                default: return;
            }

            setSelectedCell({
                row,
                column,
            });
            e.preventDefault();
        }
    };

    const table = <Switch fallback={<p>Loading...</p>}>
        <Match when={errorElements()}>
            {errorElements()}
        </Match>

        <Match when={!!data.latest}>
            <table class="data-table table table-sm" onKeyDown={onKeyDown}>
                <thead class="sticky top-0">
                    <For each={data.latest!.mainResult.columns}>{(col) =>
                        <th><div>
                            {col.name}
                        </div></th>}
                    </For>
                </thead>
                <tbody>
                    <For each={data.latest!.mainResult.rows}>{(row, rowIndex) =>
                        <tr>
                            <For each={row}>{(v, colIndex) =>
                                <td
                                    onClick={() => {
                                        const cell = { row: rowIndex(), column: colIndex() };
                                        if (isEqual(selectedCell(), cell)) {
                                            setShowDisplayPanel(!showDisplayPanel());
                                        } else {
                                            setSelectedCell(cell);
                                            setShowDisplayPanel(true);
                                        }
                                    }}
                                    aria-selected={selectedCell()?.row == rowIndex() && selectedCell()?.column == colIndex()}>
                                    {v}
                                </td>}
                            </For>
                        </tr>
                    }</For>
                </tbody>
            </table>
        </Match>
    </Switch>;

    return <div class={"flex h-full w-full flex-col items-start gap-4 " + (props.visible ? "" : "hidden")}>
        <Show when={props.queryable.canFilter && props.queryable.canSort}>
            <FilterBar setSorting={setSorting} sorting={sorting()} setWhere={setFilter} where={filter()} />
        </Show>
        <div class="w-full grow overflow-hidden flex relative justify-center">
            <div class={"overflow-scroll grow h-full " + ((showDisplayPanel() && selectedCell()) ? " pr-80" : "")}>
                {table}
            </div>

            <div class={"p-2 w-80 transform overflow-scroll bg-base-100 transition-all duration-300 top-0 right-0 absolute h-full shadow-lg " + ((showDisplayPanel() && selectedCellValue())
                ? "opacity-100 pointer-events-auto translate-x-0"
                : "opacity-0 pointer-events-none translate-x-full")}>
                <Show when={selectedCellValue()}>
                    <DataViewerPanel
                        columns={selectedCellValue()!.columnMeta ?? []}
                        value={selectedCellValue()!.value}
                        onClose={() => setShowDisplayPanel(false)}
                    />
                </Show>
            </div>

            <div class="absolute bottom-2">
                <PaginationBar
                    pagination={pagination()}
                    setPagination={setPagination}
                    totalItemCount={data.latest?.countResult}
                    onRefresh={refetch}
                />
            </div>
        </div>
    </div>
}