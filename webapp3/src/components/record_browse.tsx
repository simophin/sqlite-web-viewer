import { Key, useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { SQLQuery, useSqlQueries, Value } from "@/lib/useSqlQuery";
import { FullSizeLoader } from "./loaders";
import { KeySquare } from "lucide-react"
import useLocalStorage from "@/lib/useLocalStorage";
import { ValueCell, ValueDisplay } from "./value_display";
import { DataGrid } from "react-data-grid";

type Pagination = {
    limit?: number;
    offset?: number;
}

type Sort = {
    column: string;
    direction: 'asc' | 'desc';
}

export type RecordsQueryInfo = {
    id: string;
    primarykeyColumnsQuery?: SQLQuery;
    canPaginate: boolean;
    canSort: boolean;
    query: (options?: {
        pagination?: Pagination;
        sorts?: Sort[];
        forCount?: boolean;
    }) => SQLQuery;
};

export function tableRecordsQueryInfo(table: string): RecordsQueryInfo {
    return {
        id: `table-records-${table}`,
        canSort: true,
        canPaginate: true,
        primarykeyColumnsQuery: {
            sql: `SELECT name FROM pragma_table_xinfo(?) WHERE pk > 0 ORDER BY pk`,
            params: [table],
        },
        query: (options) => {
            const { pagination, sorts, forCount } = options || {};
            let sql = `SELECT ${forCount ? 'COUNT(*)' : '*'} FROM ${table}`;

            if (sorts && sorts.length > 0) {
                sql += ' ORDER BY ' + sorts.map(sort => `${sort.column} ${sort.direction.toUpperCase()}`).join(', ');
            }

            if (pagination && !forCount) {
                const { limit, offset } = pagination;
                if (limit !== undefined && offset !== undefined) {
                    sql += ` LIMIT ${limit}`;
                } else if (limit !== undefined) {
                    sql += ` LIMIT ${offset}, ${limit}`;
                }
            }

            return { sql };
        }
    };
}

interface QueryPaginationState {
    pageIndex: number;
}

export function RecordsTable({ info }: { info: RecordsQueryInfo }) {
    const [numPerPage, setNumPerPage] = useState(30);
    const [paginationStateMap, setPaginationStateMap] = useLocalStorage<{ [key: string]: QueryPaginationState }>('paginationStates', {});
    const paginationState = paginationStateMap[info.id] || { pageIndex: 0 };

    const queries = useMemo(() => {
        const q = [];
        let primaryKeyQueryIndex: number | undefined, countQueryIndex: number | undefined;

        if (info.primarykeyColumnsQuery) {
            primaryKeyQueryIndex = q.length;
            q.push(info.primarykeyColumnsQuery);
        }

        let pagination: Pagination | undefined;

        if (info.canPaginate) {
            pagination = {
                limit: numPerPage,
                offset: paginationState.pageIndex * numPerPage
            };

            countQueryIndex = q.length;
            q.push(info.query({ forCount: true }));
        }

        // The main query for the records
        const queryIndex = q.length;
        q.push(info.query({ pagination }));

        return {
            queries: q, primaryKeyQueryIndex, countQueryIndex, queryIndex
        }
    }, [info, info.canPaginate ? numPerPage : -1, info.canPaginate ? paginationState.pageIndex : -1]);

    const { isFetching, data, error } = useSqlQueries(queries);

    const totalRecordsCount = (() => {
        if (data && typeof queries.countQueryIndex == 'number') {
            // If a count query is provided, use it to get the total count
            return data.results.results[queries.countQueryIndex].rows[0][0] as number;
        } else if (data) {
            // If no count query is provided, no pagination is possible from the backend, total count is the length of the rows in the main query
            return data.results.results[queries.queryIndex].rows.length;
        }
        return 0;
    })();

    const numPages = totalRecordsCount > 0 ? Math.ceil(totalRecordsCount / numPerPage) : 0;

    const primaryColumns = useMemo(() => {
        if (data && typeof queries.primaryKeyQueryIndex == 'number') {
            return data.results.results[queries.primaryKeyQueryIndex].rows.map(row => row[0] as string);
        }
        return [];
    }, [data?.results, queries.primaryKeyQueryIndex]);

    // Restrict the page index to the number of pages
    useEffect(() => {
        if (paginationState.pageIndex >= numPages) {
            setPaginationStateMap((prev) => {
                if (numPages == 0) {
                    delete prev[info.id];
                } else {
                    prev[info.id] = { pageIndex: Math.max(0, numPages - 1) };
                }

                return prev;
            });
        }
    }, [numPages, paginationState.pageIndex]);

    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number, columnIndex: number } | null>(null);

    const mainResults = data?.results.results[queries.queryIndex];

    const selectedValue = selectedCell && mainResults && selectedCell.rowIndex < mainResults.rows.length && selectedCell.columnIndex < mainResults.columns.length
        ? mainResults.rows[selectedCell.rowIndex][selectedCell.columnIndex]
        : null;


    if (error) {
        return <p>Error loading records: {error.message}</p>;
    }

    const isSelectedCell = (rowIndex: number, columnIndex: number) => {
        if (!selectedCell) return false;
        return selectedCell.rowIndex == rowIndex && selectedCell.columnIndex == columnIndex;
    };

    return <div className="relative flex min-h-[300px]">
        {isFetching && <FullSizeLoader />}

        {mainResults && <Table aria-label="Records table" className="h-full flex-1 overflow-x-scroll overflow-y-scroll" shadow="none" bottomContent={
            <Pagination total={numPages} page={paginationState.pageIndex} onChange={(pageIndex) => {
                setPaginationStateMap((prev) => {
                    if (pageIndex <= 0) {
                        delete prev[info.id];
                    } else {
                        prev[info.id] = { pageIndex };
                    }
                    return prev;
                });
            }} />
        }>
            <TableHeader columns={mainResults?.columns ?? []}>
                {(column) => <TableColumn key={column.name}>
                    <span className="flex items-center gap-1 justify-start">
                        {primaryColumns.includes(column.name) && <KeySquare className="inline w-4" />}
                        {column.name}
                    </span>
                </TableColumn>}
            </TableHeader>

            <TableBody>
                {mainResults.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="cursor-default">
                        {row.map((value, columnIndex) => (
                            <TableCell
                                onClick={() => setSelectedCell({ rowIndex, columnIndex })}
                                key={columnIndex}
                                className={`${isSelectedCell(rowIndex, columnIndex) ? 'bg-blue-50' : ''} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>
                                <ValueCell value={value} />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>}

        {selectedValue && <div className="w-[25%] p-4"><Card className="p-2" shadow="sm">
            <ValueDisplay value={selectedValue} />
        </Card></div>}
    </div >
}