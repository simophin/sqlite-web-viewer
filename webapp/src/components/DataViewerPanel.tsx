import {createMemo, For, Show} from "solid-js";
import type {ColumnMeta} from "../RecordQueryable.tsx";
import JSONFormatter from "json-formatter-js";
import "./DataViewerPanel.css";
import {FaSolidX} from "solid-icons/fa";
import {useDarkTheme} from "./useDarkTheme.ts";

export default function DataViewerPanel(
    props: {
        columns: Array<ColumnMeta>,
        value: any,
        onClose: () => void,
    }
) {
    const [darkTheme] = useDarkTheme();

    const jsonDisplayDom = createMemo(() => {
        if (typeof props.value == 'string' && (props.value.startsWith('{') || props.value.startsWith('['))) {
            try {
                return (new JSONFormatter(JSON.parse(props.value.toString()), 1, {
                    theme: darkTheme() ? 'dark' : undefined,
                })).render();
            } catch (e) {
            }
        }
    });

    return (
        <div class="w-full overflow-y-scroll">
            <div class="flex items-center p-1">
                <label class="grow font-medium">Value display</label>
                <button class="btn btn-circle btn-sm mb-1" onClick={props.onClose}>
                    <FaSolidX/>
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
                  fallback={<pre class="overflow-x-scroll">{props.value?.toString()}</pre>}>
                <div class="overflow-x-scroll">
                    {jsonDisplayDom()}
                </div>
            </Show>
        </div>
    )
}
