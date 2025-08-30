import {executeSQL} from "../api.ts";
import {createResource, Match, Switch} from "solid-js";
import 'highlight.js/styles/github.min.css'
import SQLHighlightView from "./SQLHighlightView.tsx";

async function fetchTableSchema(table: string) {
    const resp = await executeSQL({
        queries: [
            {
                sql: "SELECT sql FROM sqlite_master WHERE type IN ('table', 'view') AND name = ?",
                params:[table],
            }
        ]
    });

    const sql = resp.results[0].rows[0][0] as string;
    if (!sql) {
        throw new Error(`Table or view "${table}" does not exist.`)
    }

    return sql;
}


export default function SchemaView(props: {
    visible: boolean,
    table: string,
}) {
    const [data] = createResource(props.table, fetchTableSchema);
    return <div class={"p-2 w-full max-h-full overflow-scroll " + (props.visible ? "" : " hidden")}>
        <Switch>
            <Match when={data.error}>
                <div class="alert alert-error m-4" role="alert">
                    {data.error.message}
                </div>
            </Match>

            <Match when={data.state === 'ready'}>
                <SQLHighlightView sql={data()!} class="text-sm" />
            </Match>
        </Switch>
    </div>
}