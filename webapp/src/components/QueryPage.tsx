import { createSignal, onCleanup, Show } from "solid-js";
import SQLEditor from "./SQLEditor";
import { makePersisted } from "@solid-primitives/storage";
import RecordBrowser from "./RecordBrowser";
import { rawSqlQueryable } from "../RecordQueryable.tsx";

export default function QueryPage(props: {
    pageId: string,
    visible: boolean,
}) {
    const [sql, setSql] = makePersisted(createSignal(""), {
        name: `query-editor-${props.pageId}`
    });

    const [editingValue, setEditingValue] = createSignal(sql());

    onCleanup(() => {
        setSql(editingValue());
    });

    return (
        <div class={"" + (props.visible ? "" : " hidden")}>
            <div class="">
                <SQLEditor
                    value={sql()}
                    onEditingValueChanged={setEditingValue}
                    class="w-full h-32"
                />
            </div>

            <Show when={!!sql().trim()}>
                <RecordBrowser
                    queryable={rawSqlQueryable(sql())}
                    visible={props.visible}
                />
            </Show>
        </div>
    );
}