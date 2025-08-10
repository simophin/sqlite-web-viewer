import type {Pagination, RecordQueryable, Sorting} from "./RecordQueryable.tsx";
import {createResource, createSignal, For, Match, Show, Switch} from "solid-js";
import {executeSQL, type Request} from "../api.ts";


export default function RecordBrowser(props: {
    queryable: RecordQueryable,
}) {
    const [sorting, setSorting] = createSignal<Sorting | undefined>();
    const [pagination, setPagination] = createSignal<Pagination | undefined>()
    const [filter, setFilter] = createSignal<string | undefined>();

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
            request: {queries} as Request,
            mainQueryIndex,
            countQueryIndex,
        };
    };

    const [data, {refetch}] = createResource(request, async ({request, mainQueryIndex, countQueryIndex}) => {
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

        <Match when={data()}>
            <table>
                <thead>
                    <For each={data()!.mainResult!.columns}>{(col) => <th>{col.name}</th>}</For>
                </thead>
                <tbody>
                    <For each={data()!.mainResult!.rows}>{(row) =>
                        <tr>
                            <For each={row}>{(v) => <td>{v}</td>}</For>
                        </tr>
                    }</For>
                </tbody>
            </table>
        </Match>
    </Switch>;

    return <div>
        <button onClick={() => refetch()}>Refresh</button>
        <Show when={data.loading}>&nbsp;<span>Loading...</span></Show>
        {table}
    </div>
}