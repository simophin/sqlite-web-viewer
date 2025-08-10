import {createResource, For} from 'solid-js'
import {executeSQL} from "../api.ts";

async function fetchTableList() {
    const {
        results: [
            {
                rows
            }
        ]
    } = await executeSQL({
        queries: [
            {
                sql: "SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('table', 'view') ORDER BY type, name",
                params: [],
            }
        ]
    });

    return rows.map(([name, type]) => {
        return {
            name: `${name}`,
            type: type == 'table' ? 'table' : 'view',
        }
    });
}

export default function TableListPanel(props: {
    selected: string | null,
    setSelected: (name: string) => void
}) {
    const [tablesViews] = createResource(fetchTableList)
    return (
        <div class="panel panel-left">
            <h2>Tables & Views</h2>
            <div>
                {tablesViews.loading && <div>Loading...</div>}
                {tablesViews.error && <div>Error loading tables/views</div>}
                <ul class="table-list">
                    <For each={tablesViews()}>{({name, type}) =>
                        <li
                            class={`table-list-item${props.selected === name ? '-selected' : ''}`}
                            onClick={() => props.setSelected(name)}>
                            {name} <span class="type-label">({type})</span>
                        </li>
                    }</For>
                </ul>
            </div>
        </div>
    )
}
