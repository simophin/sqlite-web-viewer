import {executeSQL} from "../api.ts";
import {createResource,  Match, Switch} from "solid-js";
import SQLHighlightView from "./SQLHighlightView.tsx";

async function fetchTrigger(name: string) {
    const {
        results: [
            {
                rows
            }
        ]
    } = await executeSQL({
        queries: [
            {
                sql: `SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?`,
                params: [name],
            }
        ]
    });

    return rows.length > 0 ? rows[0][0] as string : null;
}

export default function TriggerView(props: {
    visible: boolean,
    trigger: string,
}) {
    const [data] = createResource(props.trigger, fetchTrigger);

    return <div class={"w-full h-full p-2 overview-scroll " + (props.visible ? "" : " hidden")}>
        <h2 class="mb-2 font-medium text-lg">Trigger: {props.trigger}</h2>
        <Switch>
            <Match when={data.error}>
                <div class="alert alert-error m-2 alert-soft" role="alert">
                    {data.error.message}
                </div>
            </Match>

            <Match when={data.state === 'ready' && data()}>
                <SQLHighlightView sql={data()!} class="text-sm" />
            </Match>

            <Match when={data.state === 'ready' }>
                <div class="m-1 alert alert-info alert-soft" role="alert">
                    No data
                </div>
            </Match>
        </Switch>
    </div>

}