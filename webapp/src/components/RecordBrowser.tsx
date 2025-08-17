import "./RecordBrowser.css";

import type { Pagination, RecordQueryable, Sorting } from "./RecordQueryable.tsx";
import { createEffect, createMemo, createResource, createSignal, For, Match, Show, Switch, untrack } from "solid-js";
import { executeSQL, type Request } from "../api.ts";
import isEqual from "lodash.isequal";
import JSONFormatter from "json-formatter-js";
import { PaginationBar } from "./PaginationBar.tsx";


export default function RecordBrowser(props: {
    queryable: RecordQueryable,
    visible: boolean,
}) {
    const [sorting, setSorting] = createSignal<Sorting | undefined>();
    const [pagination, setPagination] = createSignal<Pagination | undefined>(
        props.queryable.canPaginate ? { offset: 0, limit: 100 } : undefined
    )
    const [filter, setFilter] = createSignal<string | undefined>();
    const [filterInput, setFilterInput] = createSignal<string | undefined>(filter());

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

    createEffect(() => {
        const d = data();
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
        const d = data();
        const cell = selectedCell();

        if (d && cell && cell.row < d.mainResult.rows.length && cell.column < d.mainResult.columns.length) {
            const value = d.mainResult.rows[cell.row][cell.column];
            let jsonDisplayDom;
            if (typeof value == 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    jsonDisplayDom = (new JSONFormatter(JSON.parse(value.toString()))).render();
                } catch (e) {
                }
            }

            return {
                jsonDisplayDom,
                columnMeta: d.columnMeta?.[d.mainResult.columns[cell.column].name],
                value,
            }
        }
    });

    const onKeyDown = (e: KeyboardEvent) => {
        const selected = untrack(selectedCell);
        const d = untrack(data);
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
        <Match when={data.error}>
            <p>Error loading data: {data.error()}</p>
        </Match>

        <Match when={!!data()}>
            <table class="data-table table table-sm" onKeyDown={onKeyDown}>
                <thead class="sticky top-0">
                    <For each={data()!.mainResult!.columns}>{(col) =>
                        <th><div>
                            {col.name}
                        </div></th>}
                    </For>
                </thead>
                <tbody>
                    <For each={data()!.mainResult!.rows}>{(row, rowIndex) =>
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
            <div class="flex w-full border-2 op-bar">
                <span class={filterInput() ? "" : "opacity-50"}>WHERE</span>
                <input
                    type="text"
                    class="flex-1"
                    value={filterInput() ?? ""}
                    onInput={(e) => setFilterInput(e.currentTarget.value)}
                    onKeyDown={e => {
                        if (e.key == "Enter") {
                            e.preventDefault();
                            setFilter(filterInput());
                        }
                    }}
                />

                <span class={filterInput() ? "" : "opacity-50"}>SORT</span>
                <input class="flex-1" />
            </div>
        </Show>
        <div class="w-full grow overflow-hidden flex relative justify-center">
            <div class={"overflow-scroll grow h-full " + ((showDisplayPanel() && selectedCell()) ? " pr-80" : "")}>
                {table}
            </div>

            <div class={"p-2 w-80 transform overflow-scroll bg-base-200 transition-all duration-300 top-0 right-0 absolute h-full shadow-lg " + ((showDisplayPanel() && selectedCellValue())
                ? "opacity-100 pointer-events-auto translate-x-0"
                : "opacity-0 pointer-events-none translate-x-full")}>
                <div>
                    <button class="p-1 border-neutral-200 border-2 mb-1" onClick={() => setShowDisplayPanel(false)}>
                        CLOSE
                    </button>
                </div>
                <For each={selectedCellValue()?.columnMeta ?? []}>{(meta) =>
                    <div class="flex column-row">
                        <label>{"primaryKeyPriority" in meta ? "Primary Key" : meta.label}</label>
                        <span>{"primaryKeyPriority" in meta ? "Yes" : meta.value}</span>
                    </div>
                }</For>

                <div class="flex column-row"><label>Value</label></div>
                <Show when={selectedCellValue()?.jsonDisplayDom}
                    fallback={<pre>{selectedCellValue()?.value?.toString()}</pre>}>
                    {selectedCellValue()!.jsonDisplayDom}
                </Show>
            </div>

            <div class="absolute bottom-2 bg-gray-200 p-1 rounded-md opacity-80 hover:opacity-100">
                <PaginationBar
                    pagination={pagination()}
                    setPagination={setPagination}
                    totalItemCount={data()?.countResult}
                    onRefresh={refetch}
                />
            </div>
        </div>
    </div>
}