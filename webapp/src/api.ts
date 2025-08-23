
export interface Request {
    run_in_transaction?: boolean;
    queries: ConditionalQuery[];
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

export interface ConditionalQuery extends Query {
    conditions?: { [versionCondition: string]: Query };
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
    const res = await fetch('http://localhost:3000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    })
    if (!res.ok) throw new Error('API error')
    const result: Response = await res.json();

    if (result.type === "success") {
        return result;
    } else {
        throw result;
    }
}
