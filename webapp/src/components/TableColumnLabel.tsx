import type {Sorting} from "./RecordQueryable.tsx";

export default function TableColumnLabel(props: {
    isPrimaryKey: boolean,
    sort: {
        index: number,
        desc?: boolean,
    },
    column: string,
    onSortChanged: (newSorting: Sorting | undefined) => void,
}) {
    return <></>;
}