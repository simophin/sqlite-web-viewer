import { createMemo, createSignal, onCleanup, Show } from "solid-js";
import SQLEditor from "./SQLEditor";
import { makePersisted } from "@solid-primitives/storage";
import RecordBrowser from "./RecordBrowser";
import { rawSqlQueryable } from "../RecordQueryable.tsx";

export default function QueryPage(props: {
    pageId: string,
    visible: boolean,
}) {
    const [editingValue, setEditingValue] = makePersisted(createSignal(""), {
        name: `query-editor-${props.pageId}`
    });

    const [executingSql, setExecutingSql] = createSignal<string>();
    const [executeSeq, setExecuteSeq] = createSignal(0);

    const showingQueryable = createMemo(() => {
        executeSeq(); // So that we re-execute
        if (executingSql()) {
            return rawSqlQueryable(executingSql()!);
        }
    });

    return (
        <div class={"h-full w-full flex flex-col gap-1 " + (props.visible ? "" : " hidden")}>
            <div class="border border-base-300 bg-base-100 mt-2" >
                <SQLEditor
                    value={editingValue() ?? ''}
                    onEditingValueChanged={setEditingValue}
                    class="w-full h-32"
                />

                <div class="p-2 flex gap-2 mt-1 bg-base-200/50">
                    <button
                        class="btn btn-primary btn-outline btn-xs"
                        onclick={() => {
                            setExecutingSql(editingValue());
                            setExecuteSeq(executeSeq() + 1);
                        }}>Execute</button>

                    <button class="btn btn-ghost btn-xs"
                        onclick={() => {
                            setEditingValue("");
                            setExecutingSql(undefined);
                            setExecuteSeq(executeSeq() + 1);
                        }}>Clear</button>
                </div>
            </div>

            <Show when={showingQueryable()}>
                <div class="grow overflow-y-scroll">
                    <RecordBrowser
                        queryable={showingQueryable()!}
                        visible={props.visible}
                    />
                </div>
            </Show>
        </div>
    );
}