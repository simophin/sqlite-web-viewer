import { useQuery } from "@tanstack/react-query";

export interface SqlQueryResult {
    columns: string[];
    columns_info: Map<string, { mime_type?: string}>;
    rows: string[][];
    num_affected: number;
    execution_time_us: number;
}

export function useSqlQuery(sql: string) {
    return useQuery({
        queryKey: [sql],
        queryFn: async () => {
            const resp = await fetch('http://localhost:3000/query', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            return await resp.json() as SqlQueryResult;
        },
    });
}