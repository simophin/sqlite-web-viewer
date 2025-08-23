import { createEffect, createSignal } from "solid-js";
import type { Sorting } from "./RecordQueryable";
import "./FilterBar.css";

function parseSortingInput(input: string): Sorting | undefined {
    return input.trim().split(',')
        .map(part => {
            const [name, dir] = part.trim().split(" ") as [string, string | undefined];
            return { name, desc: dir?.toLowerCase() === 'desc' };
        });
}

function serializeSortingInput(sorting: Sorting | undefined): string {
    return (sorting ?? []).map(({ name, desc }) => `${name}${desc ? ' desc' : ''}`).join(", ");
}

export default function FilterBar(props: {
    where: string | undefined;
    setWhere: (where: string | undefined) => void;
    sorting: Sorting | undefined,
    setSorting: (sort: Sorting | undefined) => void;
}) {
    const [whereInput, setWhereInput] = createSignal("");
    const [whereHasFocus, setWhereHasFocus] = createSignal(false);

    const [filterInput, setFilterInput] = createSignal("");
    const [filterHasFocus, setFilterHasFocus] = createSignal(false);

    createEffect(() => {
        setWhereInput(props.where ?? "");
    });

    createEffect(() => {
        setFilterInput(serializeSortingInput(props.sorting));
    });

    return <div class="flex w-full border-2 op-bar">
        <span class={(whereInput() || whereHasFocus()) ? "" : "opacity-50"}>WHERE</span>
        <input
            type="text"
            class="flex-1"
            onFocus={() => setWhereHasFocus(true)}
            onBlur={() => setWhereHasFocus(false)}
            value={whereInput() ?? ""}
            onInput={(e) => setWhereInput(e.currentTarget.value)}
            onKeyDown={e => {
                if (e.key == "Enter") {
                    e.preventDefault();
                    props.setWhere(whereInput());
                }
            }}
        />

        <span class={(props.sorting || filterHasFocus()) ? "" : "opacity-50"}>SORT</span>
        <input
            type="text"
            class="flex-1"
            onFocus={() => setFilterHasFocus(true)}
            onBlur={() => setFilterHasFocus(false)}
            value={filterInput() ?? ""}
            onInput={(e) => setFilterInput(e.currentTarget.value)}
            onKeyDown={e => {
                if (e.key == "Enter") {
                    e.preventDefault();
                    props.setSorting(parseSortingInput(filterInput()));
                }
            }}
        />
    </div>;
}