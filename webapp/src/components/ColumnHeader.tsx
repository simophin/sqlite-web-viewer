import { FaSolidArrowDown91, FaSolidArrowUp19, FaSolidKey, FaSolidSort } from "solid-icons/fa";
import { createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Sorting } from "../RecordQueryable.tsx";

export default function ColumnHeader(props: {
    columnName: string,
    primaryKeys?: string[],
    canSort?: boolean,
    sorting?: Sorting,
    onSortingChange?: (newSorting: Sorting) => void
}) {
    const primaryIcons = createMemo(() => {
        console.log('Primary Keys:', props.primaryKeys);
        if (!props.primaryKeys) return [];

        const index = props.primaryKeys.indexOf(props.columnName);
        if (index < 0) return [];

        const icons = [<span><FaSolidKey class="w-3 h-3" /></span>];

        if (props.primaryKeys.length > 1) {
            icons.push(<sup class="text-xs">{index + 1}</sup>)
        }

        return icons;
    });

    const sortIcons = createMemo(() => {
        if (!props.canSort) return;

        const sortIndex = props.sorting?.findIndex(s => s.name === props.columnName) ?? -1;
        let icon;

        if (sortIndex < 0) icon = FaSolidSort;
        else if (props.sorting![sortIndex].desc) icon = FaSolidArrowDown91;
        else icon = FaSolidArrowUp19;

        return <span class="btn btn-xs btn-square btn-ghost" onClick={() => {
            if (sortIndex < 0) {
                props.onSortingChange?.([
                    ...(props.sorting ?? []),
                    { name: props.columnName }
                ]);
            } else if (props.sorting![sortIndex].desc) {
                props.onSortingChange?.([
                    ...props.sorting!.slice(0, sortIndex),
                    ...props.sorting!.slice(sortIndex + 1)
                ]);
            } else {
                const newSorting = [...props.sorting!];
                newSorting[sortIndex].desc = !props.sorting![sortIndex].desc;
                props.onSortingChange?.(newSorting);
            }
        }}>
            <Dynamic component={icon} class="w-3 h-3" />

            {props.sorting && props.sorting.length > 1 && sortIndex >= 0 && (
                <sup class="text-xs">{sortIndex + 1}</sup>
            )}
        </span>;
    });

    return <div class="flex items-center gap-1 w-full h-full">
        {primaryIcons()}
        <label class="font-medium grow">{props.columnName}</label>
        {sortIcons()}
    </div>
}