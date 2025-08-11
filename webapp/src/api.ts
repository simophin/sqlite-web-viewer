
export interface Request {
    run_in_transaction?: boolean;
    queries: ConditionalQuery[];
}

export interface Response {
    execution_time_us: number;
    results: QueryResult[];
}

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

export interface QueryResult {
    columns: ColumnInfo[];
    rows: any[][];
}


export async function executeSQL(req: Request): Promise<Response> {
    const res = await fetch('http://localhost:3000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    })
    if (!res.ok) throw new Error('API error')
    return await res.json();
}
