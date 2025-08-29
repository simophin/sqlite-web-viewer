import { makePersisted } from "@solid-primitives/storage";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { rawSqlQueryable, tableRecordQueryable, type DbVersion } from "../RecordQueryable.tsx";
import RecordBrowser from "./RecordBrowser";
import SQLEditor from "./SQLEditor";

export default function QueryPage(props: {
    pageId: string,
    dbVersion: DbVersion,
    visible: boolean,
}) {
    const [editingValue, setEditingValue] = makePersisted(createSignal(""), {
        name: `query-editor-${props.pageId}`
    });

    const [history, setHistory] = makePersisted(createSignal<Array<string>>([]), {
        name: `query-editor-history-${props.pageId}`
    });
    const [historyIndex, setHistoryIndex] = createSignal<number>();

    const [executingSql, setExecutingSql] = createSignal<string>();
    const [executeSeq, setExecuteSeq] = createSignal(0);

    const showingQueryable = createMemo(() => {
        executeSeq(); // So that we re-execute

        const sql = executingSql()?.trim();
        if (!sql) {
            return;
        }

        const tableQueryMatch = sql.match(/^SELECT \* FROM ([a-zA-Z0-9_]+)$/i);
        if (tableQueryMatch) {
            return tableRecordQueryable(tableQueryMatch[1], props.dbVersion);
        }

        return rawSqlQueryable(sql);
    });

    createEffect(() => {
        const index = historyIndex();
        if (typeof index === 'number' && index >= 0) {
            setEditingValue(history()[index]);
        }
    });

    const addHistoryIfDifference = (value: string | undefined) => {
        if (value?.trim() && history()[history().length - 1] != value) {
            const newHistory = [...history(), value!];
            if (newHistory.length > 10) {
                newHistory.shift();
            }
            setHistory(newHistory);
        }
    }

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
                            if (executingSql() != editingValue()) {
                                addHistoryIfDifference(executingSql()?.trim())
                                setHistoryIndex();
                                setExecutingSql(editingValue());
                            }
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