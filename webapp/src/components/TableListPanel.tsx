import { createResource } from 'solid-js'
import { fetchTablesAndViews } from '../api'

export default function TableListPanel(props: {
    selected: string | null,
    setSelected: (name: string) => void
}) {
    const [tablesViews] = createResource(fetchTablesAndViews)
    return (
        <div class="panel panel-left">
            <h2>Tables & Views</h2>
            <div>
                {tablesViews.loading && <div>Loading...</div>}
                {tablesViews.error && <div>Error loading tables/views</div>}
                <ul class="table-list">
                    {tablesViews()?.map(item => (
                        <li
                            class={`table-list-item${props.selected === item.name ? ' selected' : ''}${item.type === 'view' ? ' view' : ''}`}
                            onClick={() => props.setSelected(item.name)}
                        >
                            {item.name} <span class="type-label">({item.type})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
