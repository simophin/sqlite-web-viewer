
import { createResource, createSignal } from 'solid-js'
import { sendSQL } from '../api'

const PAGE_SIZE = 50

export default function MainPanel(props: { selected: string | null }) {
    const [page, setPage] = createSignal(0)
    const [refreshKey, setRefreshKey] = createSignal(0)

    const [data] = createResource(() => [props.selected, page(), refreshKey()], async ([name, pageNum]) => {
        if (!name) return null
        const offset = Number(pageNum) * PAGE_SIZE
        const sql = `SELECT * FROM "${name}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`
        return await sendSQL(sql)
    })

    const handlePrev = () => setPage(p => Math.max(0, Number(p) - 1))
    const handleNext = () => setPage(p => Number(p) + 1)
    const handleRefresh = () => setRefreshKey(k => Number(k) + 1)

    // Reset page when table/view changes
    // Only reset page if selected changes and page is not 0
    // Use a ref to avoid infinite loop
    let lastSelected = null
    if (props.selected !== lastSelected) {
        lastSelected = props.selected
        if (props.selected && page() !== 0) setPage(0)
    }

    return (
        <div class="panel panel-middle">
            <h2>Working Area</h2>
            {!props.selected && <div>Select a table or view to browse data.</div>}
            {props.selected && (
                <div>
                    <h3>{props.selected}</h3>
                    <div class="browse-controls">
                        <button onClick={handlePrev} disabled={page() === 0}>Prev</button>
                        <span class="browse-page">Page {Number(page()) + 1}</span>
                        <button onClick={handleNext} disabled={!!data() && Array.isArray(data().rows) && data().rows.length < PAGE_SIZE}>Next</button>
                        <button class="browse-refresh" onClick={handleRefresh}>Refresh</button>
                    </div>
                    {data.loading && <div>Loading...</div>}
                    {data.error && <div>Error loading data</div>}
                    {data() && Array.isArray(data().columns) && Array.isArray(data().rows) ? (
                        <div class="data-table-wrapper">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        {data().columns?.map(col => (
                                            <th>{col.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data().rows?.map((row) => (
                                        <tr>
                                            {data().columns?.map((_, index) => (
                                                <td>{row[index]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
