// API call: send SQL and get result
export async function sendSQL(sql: string): Promise<{ columns: { name: string }[], rows: any[][] }> {
    const res = await fetch('http://localhost:3000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: [{ sql, params: [] }] })
    })
    if (!res.ok) throw new Error('API error')
    return (await res.json())['results'][0]
}

export async function fetchTablesAndViews(): Promise<{ name: string, type: string }[]> {
    const tablesRes = await sendSQL("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_master' ORDER BY name;")
    const viewsRes = await sendSQL("SELECT name as type FROM sqlite_master WHERE type='view' ORDER BY name;")
    return [...tablesRes.rows.map(item => ({ name: item[0] as string, type: 'table' })),
    ...viewsRes.rows.map(item => ({ name: item[0] as string, type: 'view' }))];
}
