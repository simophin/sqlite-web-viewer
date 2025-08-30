import { createSignal } from "solid-js";
import "./FilterBar.css";
import type { Sorting } from "../RecordQueryable.tsx";
import SQLEditor from "./SQLEditor";
import { FaSolidXmark } from "solid-icons/fa";

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

    const [hasWhereInput, setHasWhereInput] = createSignal(!!props.where);
    const [clearWhere, setClearWhere] = createSignal(0);
    const [hasSortingInput, setHasSortingInput] = createSignal(props.sorting && props.sorting.length > 0);
    const [clearSorting, setClearSorting] = createSignal(0);

    return <div class="op-bar">
        <label class={(whereHasFocus() || hasWhereInput()) ? "" : "opacity-50"}>WHERE</label>
        <SQLEditor
            onFocus={() => setWhereHasFocus(true)}
            onBlur={() => setWhereHasFocus(false)}
            class="op-bar-input"
            value={props.where ?? ''}
            onEditingValueChanged={input => setHasWhereInput(!!input)}
            clearSignal={clearWhere}
            onSubmit={props.setWhere} />

        <span role="button"
            style={{
                visibility: hasWhereInput() ? "visible" : "hidden"
            }}
            onclick={() => setClearWhere(c => c + 1)}>
            <FaSolidXmark />
        </span>


        <label class={(sortingHasFocus() || hasSortingInput()) ? "" : "opacity-50"}>ORDER BY</label>
        <SQLEditor
            onFocus={() => setSortingHasFocus(true)}
            onBlur={() => setSortingHasFocus(false)}
            value={serializeSortingInput(props.sorting)}
            class="op-bar-input"
            clearSignal={clearSorting}
            onSubmit={(value) => {
                const sorting = parseSortingInput(value);
                props.setSorting(sorting);
            }}
            onEditingValueChanged={input => setHasSortingInput(!!input)} />

        <span role="button"
            style={{
                visibility: hasSortingInput() ? "visible" : "hidden"
            }}
            onclick={() => setClearSorting(c => c + 1)}>
            <FaSolidXmark />
        </span>
    </div>;
}