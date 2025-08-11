import {tableRecordQueryable} from "./RecordQueryable.tsx";
import {Show} from "solid-js";
import RecordBrowser from "./RecordBrowser.tsx";

export default function MainPanel(props: { selected: string | null }) {
    const queryable = () => props.selected ? tableRecordQueryable(props.selected) : undefined;

    return (
        <div class="panel panel-middle w-full h-full">
            <Show when={!!queryable()} fallback={<p></p>}>
                <RecordBrowser queryable={queryable()!}/>
            </Show>
        </div>
    )
}
