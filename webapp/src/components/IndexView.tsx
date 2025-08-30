import {executeSQL} from "../api.ts";
import {createResource, For, Match, Switch} from "solid-js";
import SQLHighlightView from "./SQLHighlightView.tsx";

async function fetchIndexNames(table: string) {
    const resp = await executeSQL({
        queries: [
            {
                "sql": `PRAGMA index_list(${table})`,
                "params": [],
            }
        ]
    });

    return resp.results[0].rows.map((columns) => columns[1] as string);
}

async function fetchSQLs(names: string[]) {
    const resp = await executeSQL({
        queries: names
            .map((name) => ({
                "sql": "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?",
                "params": [name],
            }))
    });

    return resp.results.map((result, i) => ({
        "name": names[i],
        "sql": result.rows[0][0] as string}));
}


export default function IndexView(props: {
    visible: boolean,
    table: string,
}) {
    const [data] = createResource(props.table, async (table) => {
        return await fetchSQLs(await fetchIndexNames(table));
    });

    return <div class={"w-full h-full overview-scroll " + (props.visible ? "" : " hidden")}>
        <Switch>
            <Match when={data.error}>
                <div class="alert alert-error m-2 alert-soft" role="alert">
                    {data.error.message}
                </div>
            </Match>

            <Match when={data.state === 'ready' && data()!.length > 0}>
                <For each={data()}>{({name, sql}) =>
                    <div tabIndex="0" class="w-full collapse collapse-arrow bg-base-100 border-base-300 border mb-2">
                        <div class="collapse-title font-semibold w-full text-sm">{name}</div>
                        <div class="collapse-content overflow-x-scroll">
                            <SQLHighlightView sql={sql} class="text-sm" />
                        </div>
                    </div>
                }
                </For>
            </Match>

            <Match when={data.state === 'ready' && data()!.length == 0}>
                <div class="m-1 alert alert-info alert-soft" role="alert">
                    No data
                </div>
            </Match>
        </Switch>
    </div>
}