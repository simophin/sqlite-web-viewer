import { createSignal } from "solid-js";
import "./FilterBar.css";
import type { Sorting } from "./RecordQueryable";
import SQLEditor from "./SQLEditor";


function parseSortingInput(input: string): Sorting | undefined {
    const trimmedInput = input.trim();
    if (trimmedInput.length === 0) {
        return;
    }

    return trimmedInput.split(',')
        .map(part => {
            const [name, dir] = part.trim().split(" ") as [string, string | undefined];
            return { name, desc: dir?.toLowerCase() === 'desc' };
        });
}

function serializeSortingInput(sorting: Sorting | undefined): string {
    return (sorting ?? []).map(({ name, desc }) => `${name}${desc ? ` DESC` : ''}`).join(", ");
}

export default function FilterBar(props: {
    where: string | undefined;
    setWhere: (where: string | undefined) => void;
    sorting: Sorting | undefined,
    setSorting: (sort: Sorting | undefined) => void;
}) {
    const [whereHasFocus, setWhereHasFocus] = createSignal(false);
    const [sortingHasFocus, setSortingHasFocus] = createSignal(false);

    return <div class="flex w-full border-2 op-bar">
        <span class={(whereHasFocus() || !!props.where) ? "" : "opacity-50"}>WHERE</span>
        <div class="op-bar-input">
            <SQLEditor
                onFocus={() => setWhereHasFocus(true)}
                onBlur={() => setWhereHasFocus(false)}
                value={props.where}
                singleLine
                onSubmit={props.setWhere} />
        </div>

        <span class={(sortingHasFocus() || (props.sorting && props.sorting.length > 0)) ? "" : "opacity-50"}>ORDER BY</span>
        <div class="op-bar-input">
            <SQLEditor
                onFocus={() => setSortingHasFocus(true)}
                onBlur={() => setSortingHasFocus(false)}
                value={serializeSortingInput(props.sorting)}
                singleLine
                onSubmit={(value) => {
                    const sorting = parseSortingInput(value);
                    props.setSorting(sorting);
                }} />
        </div>
    </div>;
}