import { useQuery } from "@tanstack/react-query";

export interface ColumnInfo {
    mime_type?: string;
}

export interface SqlQueryResult {
    columns: string[];
    columns_info: { [column_name: string]: ColumnInfo };
    rows: string[][];
    num_affected: number;
    execution_time_us: number;
}

export function useSqlQuery(sql: string, params?: string[]) {
    return useQuery({
        queryKey: [sql, params],
        queryFn: async () => {
            const resp = await fetch('http://localhost:3000/query', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql, params }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            return await resp.json() as SqlQueryResult;
        },
        placeholderData: (prev) => prev,
    });
}