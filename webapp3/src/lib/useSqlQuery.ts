import { useQuery } from "@tanstack/react-query";

export interface ColumnInfo {
    name: string;
}

export type Value = string | number | null;

export interface SqlQueryResult {
    columns: ColumnInfo[];
    rows: Value[][];
    num_affected: number;
}

export type QueryResults = {
    execution_time_us: number;
    results: SqlQueryResult[];
}

export interface SQLQuery {
    sql: string;
    params?: string[];
}


export function useSingleSqlQuery(query: SQLQuery) {
    const props = useSqlQueries({
        queries: [query],
    });

    return {
        ...props,
        data: props.data ? {
            execution_time_us: props.data.results.execution_time_us,
            ...props.data.results.results[0],
        } : undefined,
    }
}

export function useSqlQueries<T extends { queries: SQLQuery[] }>(request: T) {
    return useQuery({
        queryKey: [request],
        queryFn: async () => {
            const resp = await fetch('http://localhost:3000/query', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    run_in_transaction: true,
                    queries: request.queries,
                }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            const results = await resp.json() as QueryResults;
            return {
                request, results
            }
        },
        placeholderData: (prev) => prev,
    });
}