import "./RecordBrowser.css";

import type { Pagination, RecordQueryable, Sorting } from "./RecordQueryable.tsx";
import { createEffect, createMemo, createResource, createSignal, For, Show, untrack } from "solid-js";
import { executeSQL, type Request } from "../api.ts";
import { PaginationBar } from "./PaginationBar.tsx";
import DataViewerPanel from "./DataViewerPanel.tsx";
import FilterBar from "./FilterBar.tsx";
import ColumnHeader from "./ColumnHeader.tsx";

function createRequest(queryable: RecordQueryable,
    sorting: Sorting | undefined,
    filter: string | undefined,
    pagination: Pagination | undefined) {
    const queries = [];

    const mainQueryIndex = queries.length;
    queries.push(queryable.mainQuery({
        sorting,
        pagination,
        filter,
    }));

    let countQueryIndex: number | undefined;
    if (queryable.countQuery) {
        countQueryIndex = queries.length;
        queries.push(queryable.countQuery({
            sorting,
            filter,
        }));
    }

    let columnMetaIndex;
    let columnMetaParser;
    if (queryable.columnMetaQuery) {
        columnMetaIndex = queries.length;
        columnMetaParser = queryable.columnMetaQuery.parser;
        queries.push(queryable.columnMetaQuery.query);
    }

    return {
        request: { queries } as Request,
        mainQueryIndex,
        countQueryIndex,
        columnMetaIndex,
        columnMetaParser
    };
}


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

    const [data, { refetch }] = createResource(() => createRequest(
        props.queryable,
        sorting(),
        filter(),
        pagination()
    ), async (r) => {
        const {
            request,
            mainQueryIndex,
            countQueryIndex,
            columnMetaIndex,
            columnMetaParser
        } = r;
        const resp = await executeSQL(request);

        const columnMeta = (typeof columnMetaIndex == "number" && columnMetaParser)
            ? columnMetaParser(resp.results[columnMetaIndex].rows)
            : undefined;

        const primaryKeys: string[] = [];
        if (columnMeta) {
            for (const [col, metas] of Object.entries(columnMeta)) {
                for (const m of metas) {
                    if ("primaryKeyPriority" in m) {
                        primaryKeys[m.primaryKeyPriority - 1] = col;
                    }
                }
            }
        }

        return {
            mainResult: resp.results[mainQueryIndex],
            countResult: typeof countQueryIndex == "number"
                ? (resp.results[countQueryIndex].rows[0][0] as number)
                : undefined,
            columnMeta,
            primaryKeys,
        };
    });

    const [lastSuccessResult, setLastSuccessResult] = createSignal<ReturnType<typeof data>>();

    createEffect(() => {
        if (data.state == 'ready') {
            setLastSuccessResult(data());
        }
    });

    const errorElements = createMemo(() => {
        const e = data.error;
        if (typeof e == "object" && "message" in e) {
            return <div role="alert" class="alert alert-soft alert-error">
                <span>{e.message}</span>
            </div>
        }
    });

    // Adjust pagination offset if the count result is less than the current offset
    createEffect(() => {
        const d = lastSuccessResult();
        const p = untrack(pagination);
        if (d && d.countResult && p) {
            const newPagination = {
                ...p,
                offset: Math.min(p.offset, d.countResult),
            }
            if (p.offset !== newPagination.offset || p.limit !== newPagination.limit) {
                setPagination(newPagination);
            }
        }
    });

    const selectedCellValue = createMemo(() => {
        const d = lastSuccessResult();
        const cell = selectedCell();

        if (d && cell && cell.row < d.mainResult.rows.length && cell.column < d.mainResult.columns.length) {
            return {
                columnMeta: d.columnMeta?.[d.mainResult.columns[cell.column].name],
                value: d.mainResult.rows[cell.row][cell.column],
            }
        }
    });


    const table = <Show when={!!lastSuccessResult()}>
        <table class="data-table table table-sm">
            <thead class="sticky top-0">
                <For each={lastSuccessResult()!.mainResult.columns}>{(col) =>
                    <th><ColumnHeader
                        columnName={col.name}
                        canSort={props.queryable.canSort}
                        sorting={sorting()}
                        onSortingChange={setSorting}
                        primaryKeys={lastSuccessResult()!.primaryKeys} /></th>}
                </For>
            </thead>
            <tbody>
                <For each={lastSuccessResult()!.mainResult.rows}>{(row, rowIndex) =>
                    <tr>
                        <For each={row}>{(v, colIndex) =>
                            <td
                                onClick={() => {
                                    if (selectedCell()?.row == rowIndex() && selectedCell()?.column == colIndex()) {
                                        setShowDisplayPanel(!showDisplayPanel());
                                    } else {
                                        setSelectedCell({ row: rowIndex(), column: colIndex() });
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
    </Show>;

    return <div class={"flex h-full w-full flex-col items-start gap-1 " + (props.visible ? "" : "hidden")}>
        <Show when={props.queryable.canFilter && props.queryable.canSort}>
            <FilterBar setSorting={setSorting} sorting={sorting()} setWhere={setFilter} where={filter()} />
        </Show>

        <Show when={errorElements()}>
            {errorElements()}
        </Show>

        <div class="w-full grow overflow-hidden flex relative justify-center">
            <div class={"overflow-scroll grow h-full " + ((showDisplayPanel() && selectedCell()) ? " pr-80" : "")}>
                {table}
            </div>

            <div
                class={"p-2 w-80 transform overflow-scroll bg-base-100 transition-all duration-300 top-0 right-0 absolute h-full shadow-lg " + ((showDisplayPanel() && selectedCellValue())
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
                    totalItemCount={lastSuccessResult()?.countResult}
                    onRefresh={refetch}
                    refreshing={data.loading}
                />
            </div>
        </div>
    </div>
}