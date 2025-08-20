import { createMemo, For, Show } from "solid-js";
import type { ColumnMeta } from "./RecordQueryable";
import JSONFormatter from "json-formatter-js";
import "./DataViewerPanel.css";

export default function DataViewerPanel(
    props: {
        columns: Array<ColumnMeta>,
        value: any,
        onClose: () => void,
    }
) {

    const jsonDisplayDom = createMemo(() => {
        if (typeof props.value == 'string' && (props.value.startsWith('{') || props.value.startsWith('['))) {
            try {
                return (new JSONFormatter(JSON.parse(props.value.toString()))).render();
            } catch (e) {
            }
        }
    });

    return (
        <div class="w-full overflow-y-scroll">
            <div>
                <button class="p-1 border-neutral-200 border-2 mb-1" onClick={props.onClose}>
                    CLOSE
                </button>
            </div>
            <For each={props.columns}>{(meta) =>
                <div class="flex column-row">
                    <label>{"primaryKeyPriority" in meta ? "Primary Key" : meta.label}</label>
                    <span>{"primaryKeyPriority" in meta ? "Yes" : meta.value}</span>
                </div>
            }</For>

            <div class="flex column-row"><label>Value</label></div>
            <Show when={jsonDisplayDom()}
                fallback={<pre>{props.value?.toString()}</pre>}>
                {jsonDisplayDom()}
            </Show>
        </div>
    )
}
