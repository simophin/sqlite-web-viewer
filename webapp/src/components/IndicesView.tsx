import {executeSQL} from "../api.ts";
import {createResource, For, Match, Switch} from "solid-js";

async function fetchTableIndices(table: string) {
    const resp = await executeSQL({
        queries: [
            {
                "sql": "PRAGMA index_list(?)",
                "params": [table],
            }
        ]
    });

    return resp.results[0].rows.map((columns) => columns[0] as string);
}

async function fetchIndexSqls(indices: string[]) {
    const resp = await executeSQL({
        queries: indices
            .map((index) => ({
                "sql": "SELECT sql FROM sqlite_master WHERE type='index' AND name=?",
                "params": [index],
            }))
    });

    return resp.results.map((result, i) => ({ "index": indices[i], "sql": result.rows[0][0] as string}));
}


export default function IndicesView(props: {
    visible: boolean,
    table: string,
}) {
    const [data] = createResource(props.table, async (table) => {
       return await fetchIndexSqls(await fetchTableIndices(table));
    });

    return <Switch>
        <Match when={data.error}>
            <div class="alert alert-error m-4" role="alert">
                {data.error.message}
            </div>
        </Match>

        <Match when={data.state === 'ready'}>
            <For each={data()}>{({index, sql}) =>
                <div tabIndex="0" class="collapse collapse-arrow bg-base-100 border-base-300 border mb-2">
                    <div class="collapse-title font-semibold">{index}</div>
                    <div class="collapse-content text-sm">
                        <pre><code class="language-sql">{sql}</code></pre>
                    </div>
                </div>
            }
            </For>
        </Match>
    </Switch>
}