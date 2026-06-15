import { DEV } from "solid-js";

export interface Request {
    queries: Query[];
}

export interface SuccessResponse {
    type: "success",
    execution_time_us: number;
    results: QueryResult[];
}

export interface ErrorResponse {
    type: "error",
    message: string;
    diagnostic: string | undefined;
}

type Response = SuccessResponse | ErrorResponse;

export interface Query {
    sql: string;
    params: string[];
}

export interface ColumnInfo {
    name: string;
}

export type QueryResult = {
    type: "success",
    columns: ColumnInfo[];
    rows: any[][];
};


export async function executeSQL(req: Request): Promise<SuccessResponse> {
    // Relative in production so requests resolve under the current mount
    // prefix (e.g. /__db/orders/query). The document URL must end in a
    // trailing slash for this to resolve correctly (backend redirects ensure it).
    const server = DEV ? 'http://localhost:3000/query' : 'query';

    const res = await fetch(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error('API error')
    const result: Response = await res.json();

    if (result.type === "success") {
        return result;
    } else {
        throw new Error(result.message, { cause: result["diagnostic"] });
    }
}
