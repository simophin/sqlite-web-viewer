import "./RecordBrowser.css";

import type { Pagination, RecordQueryable, Sorting } from "./RecordQueryable.tsx";
import {batch, createResource, createSignal, For, Match, Show, Switch, untrack} from "solid-js";
import { executeSQL, type Request } from "../api.ts";


export default function RecordBrowser(props: {
    queryable: RecordQueryable,
}) {
    const [sorting, setSorting] = createSignal<Sorting | undefined>();
    const [pagination, setPagination] = createSignal<Pagination | undefined>()
    const [filter, setFilter] = createSignal<string | undefined>();
    const [filterInput, setFilterInput] = createSignal<string | undefined>(filter());

    const [selectedRow, setSelectedRow] = createSignal<number | undefined>();
    const [selectedColumn, setSelectedColumn] = createSignal<number | undefined>();

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

        return {
            request: { queries } as Request,
            mainQueryIndex,
            countQueryIndex,
        };
    };

    const [data, { refetch }] = createResource(request, async ({ request, mainQueryIndex, countQueryIndex }) => {
        const resp = await executeSQL(request);

        return {
            mainResult: resp.results[mainQueryIndex],
            countResult: typeof countQueryIndex == "number"
                ? (resp.results[countQueryIndex].rows[0][0] as number)
                : undefined,
        };
    });

    const table = <Switch fallback={<p>Loading...</p>}>
        <Match when={data.error}>
            <p>Error loading data: {data.error()}</p>
        </Match>

        <Match when={!!data()}>
            <table class="data-table">
                <thead class="sticky top-0"><For each={data()!.mainResult!.columns}>{(col) => <th class="p-1">{col.name}</th>}</For></thead>
                <tbody>
                    <For each={data()!.mainResult!.rows}>{(row, rowIndex) =>
                        <tr>
                            <For each={row}>{(v, colIndex) =>
                                <td
                                    onClick={() => batch(() => {
                                        setSelectedRow(rowIndex());
                                        setSelectedColumn(colIndex());
                                    })}
                                    aria-selected={selectedRow() == rowIndex() && selectedColumn() == colIndex()}>
                                    {v}
                                </td>}
                            </For>
                        </tr>
                    }</For>
                </tbody>
            </table>
        </Match>
    </Switch>;

    return <div class="flex h-full w-full flex-col items-start p-1">
        <Show when={props.queryable.canFilter && props.queryable.canSort}>
            <div class="flex w-full op-bar">
                <span>WHERE</span>
                <input
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

                <span>SORT</span>
                <input class="flex-1" />
            </div>
        </Show>
        <div class="flex">
            <button onClick={refetch}>Refresh</button>
            <Show when={data.loading}>&nbsp;<span>Loading...</span></Show>
        </div>
        <div class="w-full grow overflow-scroll flex">
            <div class="overflow-scroll grow h-full">
                {table}
            </div>

            <div>Display Panel</div>
        </div>
    </div>
}