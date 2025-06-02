import { Key, useEffect, useMemo, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";
import { useSqlQuery } from "@/lib/useSqlQuery";
import { FullSizeLoader } from "./loaders";
import { TableInfo } from "./table_list";
import { KeySquare } from "lucide-react"
import useLocalStorage from "@/lib/useLocalStorage";
import { ValueDisplay } from "./value_display";

export interface RecordsQueryInfo {
    id: string;
    countQuery: string;
    countQueryArgs?: string[];

    primaryKeyColumns?: string[];

    query: (offset: number, limit: number) => [string, string[]];
}

export function tableRecordsQueryInfo(table: TableInfo): RecordsQueryInfo {
    return {
        id: `table-records-${table.name}`,
        countQuery: `SELECT COUNT(*) FROM ${table.name}`,
        query: (offset: number, limit: number) => [
            `SELECT * FROM ${table.name} LIMIT ${offset}, ${limit}`,
            []
        ],
        primaryKeyColumns: table.primary_key_columns,
    };
}

interface QueryPaginationState {
    pageIndex: number;
}

export type SelectedCell = {
    rowIndex: number;
    columnIndex: number;
    value: string;
    columnMimeType?: string;
};

export function RecordsTable({ info, selectedCell, onSelectedCellChange }: { info: RecordsQueryInfo, selectedCell?: SelectedCell, onSelectedCellChange?: (cell?: SelectedCell) => void }) {
    const [numPerPage, setNumPerPage] = useState(30);
    const [paginationStateMap, setPaginationStateMap] = useLocalStorage<{ [key: string]: QueryPaginationState }>('paginationStates', {});
    const paginationState = paginationStateMap[info.id] || { pageIndex: 0 };

    const { error: countError, isPending: countIsPending, data: countData } = useSqlQuery(info.countQuery, info.countQueryArgs);
    const totalRecordsCount = useMemo(() => countData ? parseInt(countData.rows[0][0]) : 0, [countData]);
    const numPages = useMemo(() => totalRecordsCount > 0 ? Math.ceil(totalRecordsCount / numPerPage) : 0, [totalRecordsCount, numPerPage]);


    // Limit the pageIndex to the number of pages available
    useEffect(() => {
        if (paginationState.pageIndex >= numPages) {
            setPaginationStateMap((prev) => ({
                ...prev,
                [info.id]: {
                    ...prev[info.id],
                    pageIndex: Math.max(0, numPages - 1)
                }
            }));
        }
    }, [numPages, paginationState.pageIndex, info.id]);

    const { error, data, isFetching } = useSqlQuery(...info.query(paginationState.pageIndex * numPerPage, numPerPage));

    if (countError) {
        return <p>Error counting records: {countError.message}</p>;
    }

    if (error) {
        return <p>Error loading records: {error.message}</p>;
    }

    const isSelectedCell = (rowIndex: number, columnIndex: number) => {
        if (!selectedCell) return false;
        return selectedCell.rowIndex == rowIndex && selectedCell.columnIndex == columnIndex;
    };

    return <div className="relative flex flex-colmin-h-[300px]">
        {data && <Table isStriped layout="auto" shadow="sm" isHeaderSticky bottomContent={
            <Pagination
                className="flex flex-col items-center justify-center gap-2"
                total={numPages} initialPage={1} page={paginationState.pageIndex + 1} onChange={(page) => setPaginationStateMap((prev) => {
                    const newState = { ...prev };
                    if (page == 1) {
                        delete newState[info.id];
                    } else {
                        newState[info.id] = { pageIndex: page - 1 };
                    }

                    return newState;
                })} />
        }>
            <TableHeader>
                {data.columns.map((col) => (
                    <TableColumn key={col}>
                        <span className="max-w-[200px] flex items-center justify-center gap-1">
                            {info.primaryKeyColumns?.includes(col) ? <KeySquare className="w-3 inline-block" /> : <></>}
                            {col}
                        </span>
                    </TableColumn>
                ))}
            </TableHeader>
            <TableBody emptyContent="No records found" isLoading={isFetching}>
                {data.rows.map((row, rowIndex) => (<TableRow>
                    {row.map((cell, columnIndex) => (
                        <TableCell
                            onClick={() => onSelectedCellChange?.({ rowIndex, columnIndex, value: cell, columnMimeType: data.columns_info[data.columns[columnIndex]]?.mime_type })}
                            className={`max-w-[200px] overflow-x-hidden whitespace-nowrap text-ellipsis ${isSelectedCell(rowIndex, columnIndex) ? "bg-green-200" : ""}`} >
                            <span className="cursor-default">{cell}</span>
                        </TableCell>
                    ))}
                </TableRow>))}
            </TableBody>
        </Table>
        }


        {(isFetching || countIsPending) && <FullSizeLoader />}
    </div >
}