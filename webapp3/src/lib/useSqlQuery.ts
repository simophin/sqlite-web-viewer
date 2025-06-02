import { useQuery } from "@tanstack/react-query";

export interface ColumnInfo {
    name: string;
    mime_type?: string;
}

export type Value = string | number | null;

export interface SqlQueryResult {
    columns: ColumnInfo[];
    rows: Value[][];
    num_affected: number;
    execution_time_us: number;
}

export interface SQLQuery {
    sql: string;
    args?: string[];
}

export function useSqlQuery({ sql, args }: SQLQuery) {
    return useQuery({
        queryKey: [sql, args],
        queryFn: async () => {
            const resp = await fetch('http://localhost:3000/query', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql, params: args }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            return await resp.json() as SqlQueryResult;
        },
        placeholderData: (prev) => prev,
    });
}