import { createEffect, createSignal } from "solid-js";
import "./FilterBar.css";
import type { Sorting } from "./RecordQueryable";
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

    const [whereInput, setWhereInput] = createSignal(props.where);
    const [sortingInput, setSortingInput] = createSignal(serializeSortingInput(props.sorting));

    createEffect(() => {
        setWhereInput(props.where);
    });

    createEffect(() => {
        setSortingInput(serializeSortingInput(props.sorting));
    });

    return <div class="flex w-full border-2 op-bar items-center">
        <label class={(whereHasFocus() || !!props.where) ? "" : "opacity-50"}>WHERE</label>
        <div class="op-bar-input">
            <SQLEditor
                onFocus={() => setWhereHasFocus(true)}
                onBlur={() => setWhereHasFocus(false)}
                value={whereInput()}
                onValueChanged={setWhereInput}
                singleLine
                onSubmit={() => props.setWhere(whereInput())} />
        </div>

        <span role="button"
            style={{
                visibility: whereInput() ? "visible" : "hidden"
            }}
            onclick={() => {
                setWhereInput('');
                props.setWhere(undefined);
            }}>
            <FaSolidXmark />
        </span>


        <label class={(sortingHasFocus() || (props.sorting && props.sorting.length > 0)) ? "" : "opacity-50"}>ORDER BY</label>
        <div class="op-bar-input">
            <SQLEditor
                onFocus={() => setSortingHasFocus(true)}
                onBlur={() => setSortingHasFocus(false)}
                value={sortingInput()}
                singleLine
                onSubmit={(value) => {
                    const sorting = parseSortingInput(value);
                    props.setSorting(sorting);
                }}
                onValueChanged={setSortingInput} />
        </div>

        <span role="button"
            style={{
                visibility: sortingInput() ? "visible" : "hidden"
            }}
            onclick={() => {
                setSortingInput('');
                props.setSorting(undefined);
            }}>
            <FaSolidXmark />
        </span>
    </div>;
}