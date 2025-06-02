import { Key, useEffect, useMemo, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { SQLQuery, useSqlQuery, Value } from "@/lib/useSqlQuery";
import { FullSizeLoader } from "./loaders";
import { KeySquare } from "lucide-react"
import useLocalStorage from "@/lib/useLocalStorage";
import { ValueCell, ValueDisplay } from "./value_display";


export interface RecordsQueryInfo {
    id: string;
    countQuery: SQLQuery,
    primarykeyColumnsQuery?: SQLQuery;

    query: (offset: number, limit: number) => SQLQuery;
}

export function tableRecordsQueryInfo(table: string): RecordsQueryInfo {
    return {
        id: `table-records-${table}`,
        countQuery: {
            sql: `SELECT COUNT(*) FROM ${table}`,
        },
        query: (offset: number, limit: number) => ({
            sql: `SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}`,
        }),
        primarykeyColumnsQuery: {
            sql: `SELECT name FROM pragma_table_info(?) WHERE pk > 0`,
            args: [table],
        },
    };
}

interface QueryPaginationState {
    pageIndex: number;
}


export function RecordsTable({ info }: { info: RecordsQueryInfo }) {
    const [numPerPage, setNumPerPage] = useState(30);
    const [paginationStateMap, setPaginationStateMap] = useLocalStorage<{ [key: string]: QueryPaginationState }>('paginationStates', {});
    const paginationState = paginationStateMap[info.id] || { pageIndex: 0 };

    const { error: countError, isPending: countIsPending, data: countData } = useSqlQuery(info.countQuery);
    const totalRecordsCount = useMemo(() => countData ? (countData.rows[0][0] as number) : 0, [countData]);
    const numPages = useMemo(() => totalRecordsCount > 0 ? Math.ceil(totalRecordsCount / numPerPage) : 0, [totalRecordsCount, numPerPage]);

    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number, columnIndex: number } | null>(null);

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

    const { error, data, isFetching } = useSqlQuery(info.query(paginationState.pageIndex * numPerPage, numPerPage));

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

    return <div className="relative flex min-h-[300px]">
        {data && <Table isStriped layout="auto" shadow="sm" bottomContent={
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
        } key={info.id}>
            <TableHeader>
                {data.columns.map((col) => (
                    <TableColumn key={col.name}>
                        <span className="max-w-[200px] flex items-center justify-center gap-1">
                            {/* {info.primaryKeyColumns?.includes(col) ? <KeySquare className="w-3 inline-block" /> : <></>} */}
                            {col.name}
                        </span>
                    </TableColumn>
                ))}
            </TableHeader>
            <TableBody emptyContent="No records found" isLoading={isFetching}>
                {data.rows.map((row, rowIndex) => (<TableRow>
                    {row.map((cell, columnIndex) => (
                        <TableCell
                            onFocus={() => setSelectedCell({ rowIndex, columnIndex })}
                            onClick={() => setSelectedCell({ rowIndex, columnIndex })}
                            className={`max-w-[200px] overflow-x-hidden whitespace-nowrap text-ellipsis ${isSelectedCell(rowIndex, columnIndex) ? "bg-green-200 font-bold" : ""}`} >
                            <span className="cursor-default"><ValueCell value={cell} /></span>
                        </TableCell>
                    ))}
                </TableRow>))}
            </TableBody>
        </Table>
        }


        {(isFetching || countIsPending) && <FullSizeLoader />}
    </div >
}